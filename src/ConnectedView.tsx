import Gooey, { calc, collection, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedMedia } from './ConnectedMedia';
import { ConnectedMessages } from './ConnectedMessages';
import { DynamicMediaStreams } from './DynamicMediaStreams';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { isWireChatMessage, isWireRenameMessage } from './types';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }, { onMount }) => {
    const isConnected = calc(() => {
        const state = appState.getState();
        return state.type === 'connected' && state.connected;
    });
    const chatMessages = collection<LocalMessage>([
        {
            type: 'chatstart',
            from: 'peer',
            sent: Date.now(),
        },
    ]);

    const dynamicMediaStreams = new DynamicMediaStreams();

    let userMediaStream: MediaStream | undefined;

    const localName = field('You');
    const peerName = field('Friend');
    peer.onMessage((message) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(message);
        } catch (e) {
            return;
        }
        if (isWireRenameMessage(parsed)) {
            const priorName = peerName.get();
            peerName.set(parsed.name);
            chatMessages.push({
                type: 'name',
                from: 'peer',
                sent: parsed.sent,
                priorName,
                name: parsed.name,
            });
        }
        if (isWireChatMessage(parsed)) {
            chatMessages.push({
                type: 'chat',
                from: 'peer',
                sent: parsed.sent,
                msg: parsed.msg,
            });
        }
    });
    peer.onTrack((track, streams, tranceiver) => {
        for (const stream of streams) {
            dynamicMediaStreams.addStream({
                peer,
                mediaStream: stream,
                tranceiver,
                isLocal: false,
            });
        }
    });

    return (
        <div class="ConnectedView">
            <ConnectedMedia
                class="ConnectedView_media"
                dynamicMediaStreams={dynamicMediaStreams}
            />
            <ConnectedMessages
                class="ConnectedView_messages"
                isConnected={isConnected}
                localName={localName}
                peerName={peerName}
                chatMessages={chatMessages}
            />
            <ConnectedControls
                class="ConnectedView_controls"
                isConnected={isConnected}
                localName={localName}
                peerName={peerName}
                onRename={(newName) => {
                    const priorName = localName.get();
                    localName.set(newName);
                    const localMessage: LocalMessage = {
                        type: 'name',
                        sent: Date.now(),
                        from: 'you',
                        priorName,
                        name: newName,
                    };
                    const wireMessage: WireDataMessage = {
                        type: 'name',
                        sent: Date.now(),
                        name: newName,
                    };
                    chatMessages.push(localMessage);
                    peer.send(JSON.stringify(wireMessage));
                }}
                onShareUserMedia={(mediaStream) => {
                    if (userMediaStream) {
                        // TODO: tell the peer that this stream is going away
                        dynamicMediaStreams.removeStream(userMediaStream);
                        for (const track of userMediaStream.getTracks()) {
                            track.stop();
                        }
                        userMediaStream = undefined;
                    }
                    if (mediaStream) {
                        const senders: RTCRtpSender[] = [];
                        for (const track of mediaStream.getTracks()) {
                            senders.push(
                                peer.peerConnection.addTrack(track, mediaStream)
                            );
                        }
                        dynamicMediaStreams.addStream({
                            peer,
                            mediaStream,
                            senders,
                            isLocal: true,
                        });
                        userMediaStream = mediaStream;
                    }
                }}
                onSendMessage={(msg) => {
                    const localMessage: LocalMessage = {
                        type: 'chat',
                        sent: Date.now(),
                        from: 'you',
                        msg,
                    };
                    const wireMessage: WireDataMessage = {
                        type: 'chat',
                        sent: Date.now(),
                        msg,
                    };
                    chatMessages.push(localMessage);
                    peer.send(JSON.stringify(wireMessage));
                }}
            />
        </div>
    );
};
