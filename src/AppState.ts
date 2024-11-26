import { calc, collection, field } from '@srhazi/gooey';
import type { Collection, Field } from '@srhazi/gooey';

import { DynamicMediaStreams } from './DynamicMediaStreams';
import { FileSendQueue } from './FileSendQueue';
import type { PeerService } from './Peer';
import {
    isWireChatMessage,
    isWireRenameMessage,
    isWireSendFile,
} from './types';
import type { LocalMessage } from './types';
import type { PromiseHandle } from './utils';
import { assert, makePromise } from './utils';

export type StateMachineState =
    | { type: 'start_host' }
    | { type: 'invite_creating' }
    | { type: 'invite_created'; inviteMessage: string; copied: boolean }
    | {
          type: 'response_accepted';
          inviteMessage: string;
          responseMessage: string;
      }
    | { type: 'connected'; connected: boolean }
    | { type: 'error'; reason: string }
    | { type: 'start_guest'; inviteMessage: string }
    | { type: 'invite_accepted'; inviteMessage: string }
    | { type: 'invite_rejected'; inviteMessage: string }
    | {
          type: 'response_created';
          inviteMessage: string;
          responseMessage: string;
          copied: boolean;
      };

export type StateMachineTransitions =
    | { event: 'create_invitation' }
    | { event: 'create_invitation_ok'; inviteMessage: string }
    | { event: 'create_invitation_failed' } // TODO: never occurs, but what if there aren't ICE candidates?
    | { event: 'copy_invitation' }
    | { event: 'receive_and_accept_response'; responseMessage: string }
    | { event: 'reject_response' }
    | { event: 'establish_connection' }
    | { event: 'disconnect_connection' }
    | { event: 'accept_invitation' }
    | { event: 'reject_invitation' }
    | { event: 'create_response'; responseMessage: string }
    | { event: 'create_response_failed' }
    | { event: 'copy_response' };

function getInitialState(): StateMachineState {
    let hash = location.hash;
    if (hash.startsWith('#')) {
        hash = hash.slice(1);
    }
    if (hash) {
        location.hash = '';
        return {
            type: 'start_guest',
            inviteMessage: hash,
        };
    }
    return { type: 'start_host' };
}

export class AppState implements Disposable {
    public peerResponsePromise: PromiseHandle<string>;
    public dynamicMediaStreams: DynamicMediaStreams;
    public chatMessages: Collection<LocalMessage>;
    public localName: Field<string>;
    public peerName: Field<string>;
    public fileSendQueue?: FileSendQueue;

    private state: Field<StateMachineState>;
    public activeView = calc(() => this.state.get().type);
    private peer?: PeerService;
    private unsubscribeConnectionState?: () => void;
    private unsubscribeMessage?: () => void;
    private unsubscribeTrack?: () => void;

    constructor() {
        // TODO: this is super awkward; the way the state and peer are coupled is not good
        this.peerResponsePromise = makePromise<string>();

        this.state = field(getInitialState());

        this.dynamicMediaStreams = new DynamicMediaStreams();
        this.chatMessages = collection([]);
        this.localName = field('You');
        this.peerName = field('Friend');
        this.fileSendQueue = undefined;

        this.peer = undefined;
        this.unsubscribeConnectionState = undefined;
        this.unsubscribeMessage = undefined;
        this.unsubscribeTrack = undefined;
    }

    setPeer(peer: PeerService) {
        assert(!this.peer, 'Must set peer only once');
        this.peer = peer;
        this.fileSendQueue = new FileSendQueue(peer);
        let isConnected = false;
        this.unsubscribeConnectionState = this.peer.connectionState.subscribe(
            (err, connectionState) => {
                if (!err) {
                    const wasConnected = isConnected;
                    isConnected = connectionState === 'connected';
                    if (!wasConnected && isConnected) {
                        this.chatMessages.push({
                            type: 'chatstart',
                            from: 'peer',
                            sent: Date.now(),
                        });
                    } else if (wasConnected && !isConnected) {
                        this.chatMessages.push({
                            type: 'disconnected',
                        });
                    }
                }
            }
        );

        this.unsubscribeMessage = peer.onMessage((message) => {
            let parsed: unknown;
            try {
                parsed = JSON.parse(message);
            } catch {
                return;
            }
            if (isWireRenameMessage(parsed)) {
                const priorName = this.peerName.get();
                this.peerName.set(parsed.name);
                this.chatMessages.push({
                    type: 'name',
                    from: 'peer',
                    sent: parsed.sent,
                    priorName,
                    name: parsed.name,
                });
            }
            if (isWireChatMessage(parsed)) {
                this.chatMessages.push({
                    type: 'chat',
                    from: 'peer',
                    sent: parsed.sent,
                    msg: parsed.msg,
                });
            }
            if (isWireSendFile(parsed)) {
                this.chatMessages.push({
                    type: 'file',
                    from: 'peer',
                    sent: parsed.sent,
                    fileName: parsed.fileName,
                    length: parsed.length,
                    content: parsed.content,
                });
            }
        });
        this.unsubscribeTrack = peer.onTrack((track, streams, tranceiver) => {
            for (const stream of streams) {
                this.dynamicMediaStreams.addStream({
                    mediaStream: stream,
                    tranceiver,
                    isLocal: false,
                });
            }
        });
    }

    dispose() {
        this.unsubscribeConnectionState?.();
        this.unsubscribeMessage?.();
        this.unsubscribeTrack?.();
        this.fileSendQueue?.dispose();
    }

    [Symbol.dispose]() {
        this.dispose();
    }

    processResponse(response: string) {
        this.peerResponsePromise.resolve(response);
    }

    _testSetState(state: StateMachineState) {
        this.state.set(state);
    }

    getState() {
        return this.state.get();
    }

    private transition(transition: StateMachineTransitions): StateMachineState {
        const state = this.state.get();
        switch (transition.event) {
            case 'create_invitation':
                if (state.type === 'start_host') {
                    return { type: 'invite_creating' };
                }
                break;
            case 'create_invitation_ok':
                if (state.type === 'invite_creating') {
                    return {
                        type: 'invite_created',
                        inviteMessage: transition.inviteMessage,
                        copied: false,
                    };
                }
                break;
            case 'create_invitation_failed':
                if (state.type === 'invite_creating') {
                    return {
                        type: 'error',
                        reason: 'Something went wrong when creating an invitation',
                    };
                }
                break;
            case 'copy_invitation':
                if (state.type === 'invite_created') {
                    return {
                        type: 'invite_created',
                        inviteMessage: state.inviteMessage,
                        copied: true,
                    };
                }
                break;
            case 'receive_and_accept_response':
                if (state.type === 'invite_created') {
                    return {
                        type: 'response_accepted',
                        inviteMessage: state.inviteMessage,
                        responseMessage: transition.responseMessage,
                    };
                }
                break;
            case 'reject_response':
                if (state.type === 'invite_created') {
                    return state;
                }
                break;
            case 'establish_connection':
                return {
                    type: 'connected',
                    connected: true,
                };
                break;
            case 'disconnect_connection':
                if (state.type === 'connected') {
                    return {
                        type: 'connected',
                        connected: false,
                    };
                }
                // Completely ignore disconnected messages unless we're connected
                return state;
            case 'accept_invitation':
                if (state.type === 'start_guest') {
                    return {
                        type: 'invite_accepted',
                        inviteMessage: state.inviteMessage,
                    };
                }
                break;
            case 'reject_invitation':
                if (state.type === 'start_guest') {
                    return {
                        type: 'invite_rejected',
                        inviteMessage: state.inviteMessage,
                    };
                }
                break;
            case 'create_response':
                if (state.type === 'invite_accepted') {
                    return {
                        type: 'response_created',
                        inviteMessage: state.inviteMessage,
                        responseMessage: transition.responseMessage,
                        copied: false,
                    };
                }
                break;
            case 'create_response_failed':
                if (state.type === 'invite_accepted') {
                    return {
                        type: 'error',
                        reason: 'Something went wrong when creating an invitation',
                    };
                }
                break;
            case 'copy_response':
                if (state.type === 'response_created') {
                    return {
                        type: 'response_created',
                        inviteMessage: state.inviteMessage,
                        responseMessage: state.responseMessage,
                        copied: true,
                    };
                }
                break;
        }
        return {
            type: 'error',
            reason: `Unexpected state machine transition: ${JSON.stringify({
                state,
                transition,
            })}`,
        };
    }

    dispatch = (action: StateMachineTransitions) => {
        this.state.set(this.transition(action));
    };

    isHost = calc(() => {
        return [
            'start_host',
            'invite_creating',
            'invite_created',
            'invite_sent',
            'response_accepted',
        ].includes(this.activeView.get());
    });

    isGuest = calc(() => {
        return [
            'start_guest',
            'invite_accepted',
            'invite_rejected',
            'response_created',
            'response_sent',
        ].includes(this.activeView.get());
    });

    isPaired = calc(() => {
        return ['connected'].includes(this.activeView.get());
    });
}
