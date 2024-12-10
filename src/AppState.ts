import { calc, collection, field } from '@srhazi/gooey';
import type { Collection, Field } from '@srhazi/gooey';

import { base64ToBytes, bytesToBase64 } from './base64';
import { DynamicMediaStreams } from './DynamicMediaStreams';
import type { FileService, SentFileState } from './FileService';
import type { PeerService } from './Peer';
import {
    isWireChatMessage,
    isWireMessage,
    isWireRenameMessage,
    isWireSendFileAccept,
    isWireSendFileCancel,
    isWireSendFileChunk,
    isWireSendFileChunkAck,
    isWireSendFileReject,
    isWireSendFileRequest,
} from './types';
import type { LocalMessage, WireMessage } from './types';
import type { PromiseHandle } from './utils';
import { assert, assertExhausted, makePromise } from './utils';

// The maximum WebRTC message size is ~16 Kb; see http://viblast.com/blog/2015/2/5/webrtc-data-channel-message-size/
const FILE_CHUNK_SIZE = 1024 * 8;

// ReadableStream[Symbol.asyncIterator] is not implemented in Safari
// Adapted from https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542#discussioncomment-6071004
async function* makeAsyncStreamIterator<T>(stream: ReadableStream<T>) {
    const reader = stream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) return;
            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}
async function* makeChunkedStreamIterator(stream: ReadableStream<Uint8Array>) {
    const asyncIterator = makeAsyncStreamIterator(stream);

    const buffer = new Uint8Array(FILE_CHUNK_SIZE);
    let cIndex = 0;
    let bIndex = 0;
    let chunk: undefined | Uint8Array;

    while (true) {
        // If our chunk is fully read (or this is our first iteration), read the next chunk
        if (!chunk || cIndex >= chunk.length) {
            const result = await asyncIterator.next();
            if (result.done) {
                // If we're done and we have a pending buffer, return the remaining buffer
                if (bIndex >= 0) {
                    yield buffer.slice(0, bIndex);
                }
                return;
            }
            chunk = result.value;
            cIndex = 0;
        }
        // Read from the chunk into the buffer until either is filled
        for (
            ;
            cIndex < chunk.length && bIndex < buffer.length;
            ++cIndex, ++bIndex
        ) {
            buffer[bIndex] = chunk[cIndex];
        }
        // If our buffer is filled, flush it
        if (bIndex >= buffer.length) {
            yield buffer;
            bIndex = 0;
        }
    }
}

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

    private state: Field<StateMachineState>;
    public activeView = calc(() => this.state.get().type);
    private peer?: PeerService;
    private unsubscribeConnectionState?: () => void;
    private unsubscribeMessage?: () => void;
    private unsubscribeTrack?: () => void;
    private fileService: FileService;
    private nextFileId: number;

    constructor(fileService: FileService) {
        this.fileService = fileService;
        // TODO: this is super awkward; the way the state and peer are coupled is not good
        this.peerResponsePromise = makePromise<string>();

        this.state = field(getInitialState());

        this.dynamicMediaStreams = new DynamicMediaStreams();
        this.chatMessages = collection([]);
        this.localName = field('You');
        this.peerName = field('Friend');

        this.peer = undefined;
        this.unsubscribeConnectionState = undefined;
        this.unsubscribeMessage = undefined;
        this.unsubscribeTrack = undefined;
        this.nextFileId = 0;
    }

    getReceivedFileState(id: string) {
        return this.fileService.getReceivedFileState(id);
    }

    getSentFileState(id: string) {
        return this.fileService.getSentFileState(id);
    }

    acceptFile(id: string) {
        const receivedFileState = this.fileService.getReceivedFileState(id);
        assert(receivedFileState, 'Unable to accept file that does not exist');
        const status = receivedFileState.status.get();
        assert(
            status === 'requested',
            'Unable to accept file that is not requested',
            {
                id,
                status,
                receivedFileState,
            }
        );
        receivedFileState.status.set('accepted');
        this.sendWireMessage({
            type: 'file_send_accept',
            sent: Date.now(),
            id,
        });
    }

    rejectFile(id: string) {
        const receivedFileState = this.fileService.getReceivedFileState(id);
        assert(receivedFileState, 'Unable to reject file that does not exist');
        const status = receivedFileState.status.get();
        assert(
            status === 'requested' || status === 'receiving',
            'Unable to reject file that is not requested/receiving',
            {
                id,
                status,
                receivedFileState,
            }
        );
        receivedFileState.status.set('rejected');
        this.sendWireMessage({
            type: 'file_send_reject',
            sent: Date.now(),
            id,
        });
    }

    cancelFile(id: string) {
        const sentFileState = this.fileService.getSentFileState(id);
        assert(sentFileState, 'Unable to reject file that does not exist');
        const status = sentFileState.status.get();
        assert(
            status === 'requested' ||
                status === 'accepted' ||
                status === 'sending',
            'Unable to reject file that is not requested/accepted/sending',
            {
                id,
                status,
                sentFileState,
            }
        );
        sentFileState.status.set('cancelled');
        this.sendWireMessage({
            type: 'file_send_cancel',
            sent: Date.now(),
            id,
        });
    }

    sendMessage(message: string) {
        assert(this.peer, 'Cannot send message without peer');
        const when = Date.now();
        const localMessage: LocalMessage = {
            type: 'chat',
            sent: when,
            from: 'you',
            msg: message,
        };
        this.chatMessages.push(localMessage);
        this.sendWireMessage({
            type: 'chat',
            sent: when,
            msg: message,
        });
    }

    sendWireMessage(message: WireMessage) {
        assert(this.peer, 'Cannot send message without peer');
        this.peer.send(JSON.stringify(message));
    }

    sendFile(file: File) {
        const stream = file.stream();
        const asyncIterator = makeChunkedStreamIterator(stream);
        assert(this.peer, 'Cannot send file without peer');
        const when = Date.now();
        const id = `s:${this.nextFileId++}`;
        const fileState: SentFileState = {
            id,
            status: field('requested'),
            ackOffset: field(0),
            sendOffset: field(0),
            file,
            asyncIterator,
        };
        this.fileService.setSentFileState(id, fileState);
        const localMessage: LocalMessage = {
            type: 'file_send',
            sent: when,
            from: 'you',
            id: fileState.id,
        };
        this.chatMessages.push(localMessage);
        this.sendWireMessage({
            type: 'file_send',
            sent: when,
            id,
            name: file.name,
            mimeType: file.type,
            size: file.size,
        });
    }

    private async sendNextFileChunk(sentFileState: SentFileState) {
        assert(this.peer, 'Cannot send file chunk without peer');
        const status = sentFileState.status.get();
        if (status === 'rejected') {
            // File has been rejected by peer, stop sending
            return;
        }
        assert(
            status === 'accepted' || status === 'sending',
            'Sent file in unexpected state',
            {
                status,
                sentFileState,
            }
        );
        const ackOffset = sentFileState.ackOffset.get();
        const sendOffset = sentFileState.sendOffset.get();
        assert(
            ackOffset === sendOffset,
            'Offset mismatch, expected file chunk ack offset to be send offset',
            {
                ackOffset,
                sendOffset,
                sentFileState,
            }
        );
        if (status !== 'sending') {
            sentFileState.status.set('sending');
        }
        const result = await sentFileState.asyncIterator.next();
        if (result.done) {
            assert(
                sendOffset === sentFileState.file.size,
                'Unexpected end of file!',
                {
                    ackOffset,
                    sendOffset,
                    sentFileState,
                }
            );
            sentFileState.status.set('sent');
            return;
        }
        const endOffset = sendOffset + result.value.length;
        sentFileState.sendOffset.set(endOffset);
        const encoded = bytesToBase64(result.value);
        this.sendWireMessage({
            type: 'file_send_chunk',
            id: sentFileState.id,
            sent: Date.now(),
            data: encoded,
            end: endOffset,
            offset: ackOffset,
        });
    }

    setPeer(peer: PeerService) {
        assert(!this.peer, 'Must set peer only once');
        this.peer = peer;
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
            if (isWireMessage(parsed)) {
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
                } else if (isWireChatMessage(parsed)) {
                    this.chatMessages.push({
                        type: 'chat',
                        from: 'peer',
                        sent: parsed.sent,
                        msg: parsed.msg,
                    });
                } else if (isWireSendFileRequest(parsed)) {
                    this.fileService.setReceivedFileState(parsed.id, {
                        id: parsed.id,
                        name: parsed.name,
                        mimeType: parsed.mimeType,
                        size: parsed.size,
                        chunks: [],
                        status: field('requested'),
                        contents: field(undefined),
                        lastOffset: field(0),
                    });
                    this.chatMessages.push({
                        type: 'file_recv',
                        sent: parsed.sent,
                        from: 'peer',
                        id: parsed.id,
                    });
                } else if (isWireSendFileAccept(parsed)) {
                    const sentFileState = this.fileService.getSentFileState(
                        parsed.id
                    );
                    assert(
                        sentFileState,
                        'Got a file accept for a sent id that does not exist'
                    );
                    sentFileState.status.set('accepted');
                    this.sendNextFileChunk(sentFileState).catch((e) => {
                        console.error(
                            'Error received when sending next file chunk',
                            e
                        );
                    });
                } else if (isWireSendFileReject(parsed)) {
                    const sentFileState = this.fileService.getSentFileState(
                        parsed.id
                    );
                    assert(
                        sentFileState,
                        'Got a file accept for a sent id that does not exist'
                    );
                    sentFileState.status.set('rejected');
                } else if (isWireSendFileCancel(parsed)) {
                    const receivedFileState =
                        this.fileService.getReceivedFileState(parsed.id);
                    assert(
                        receivedFileState,
                        'Got a file cancel for a received file that does not exist'
                    );
                    receivedFileState.status.set('cancelled');
                } else if (isWireSendFileChunk(parsed)) {
                    const receivedFileState =
                        this.fileService.getReceivedFileState(parsed.id);
                    assert(
                        receivedFileState,
                        'Got a file chunk for a received file that does not exist'
                    );
                    const status = receivedFileState.status.get();
                    assert(
                        status === 'accepted' || status === 'receiving',
                        'Got a file chunk when file in incorrect state',
                        {
                            status,
                            receivedFileState,
                        }
                    );
                    if (status !== 'receiving') {
                        receivedFileState.status.set('receiving');
                    }
                    const lastOffset = receivedFileState.lastOffset.get();
                    assert(
                        lastOffset === parsed.offset,
                        'Got out of order file chunk',
                        {
                            receivedFileState,
                            lastOffset,
                            parsed,
                        }
                    );
                    receivedFileState.chunks.push(parsed.data);
                    receivedFileState.lastOffset.set(parsed.end);
                    this.sendWireMessage({
                        type: 'file_send_chunk_ack',
                        sent: Date.now(),
                        id: parsed.id,
                        end: parsed.end,
                    });
                    if (parsed.end >= receivedFileState.size) {
                        const contents = new Uint8Array(receivedFileState.size);
                        let offset = 0;
                        for (const chunk of receivedFileState.chunks) {
                            const decoded = base64ToBytes(chunk);
                            contents.set(decoded, offset);
                            offset += decoded.length;
                        }
                        receivedFileState.status.set('received');
                        receivedFileState.contents.set(contents);
                    }
                } else if (isWireSendFileChunkAck(parsed)) {
                    const sentFileState = this.fileService.getSentFileState(
                        parsed.id
                    );
                    assert(
                        sentFileState,
                        'Got file chunk ack for sent file that does not exist'
                    );
                    const status = sentFileState.status.get();
                    assert(
                        status === 'sending',
                        'Got file chunk ack for sent file in wrong status',
                        {
                            sentFileState,
                            status,
                            parsed,
                        }
                    );
                    const ackOffset = sentFileState.ackOffset.get();
                    const sendOffset = sentFileState.sendOffset.get();
                    assert(
                        sendOffset === parsed.end,
                        'Got out of order file chunk ack',
                        {
                            sentFileState,
                            ackOffset,
                            sendOffset,
                            parsed,
                        }
                    );
                    sentFileState.ackOffset.set(parsed.end);
                    this.sendNextFileChunk(sentFileState).catch((e) => {
                        console.error(
                            'Error received when sending next file chunk',
                            e
                        );
                    });
                } else {
                    assertExhausted(parsed);
                }
            } else {
                console.log('UNEXPECTED WIRE MESSAGE', parsed);
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
