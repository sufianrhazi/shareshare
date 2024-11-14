import Gooey, { collection, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedMessages } from './ConnectedMessages';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { isWireChatMessage, isWireRenameMessage } from './types';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer }, { onMount }) => {
    const chatMessages = collection<LocalMessage>([
        {
            type: 'chatstart',
            from: 'peer',
            sent: Date.now(),
        },
    ]);

    const userMediaStream = field<MediaStream | undefined>(undefined);

    const localName = field('You');
    const peerName = field('Friend');
    peer.onMessage((message) => {
        let parsed: WireDataMessage;
        try {
            parsed = JSON.parse(message);
        } catch (e) {
            console.warn('Got malformed message', e);
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
    const sharedElements = collection<JSX.Node>([]);
    peer.onTrack((track, streams) => {
        if (track.kind === 'video') {
            const video = document.createElement('video');
            video.srcObject = streams[0];
            video.setAttribute(
                'controlslist',
                'nodownload nofullscreen noremoteplayback'
            );
            sharedElements.push(video);
            video.play();
        } else if (track.kind === 'audio') {
            const audio = document.createElement('audio');
            audio.setAttribute(
                'controlslist',
                'nodownload nofullscreen noremoteplayback'
            );
            audio.srcObject = streams[0];
            sharedElements.push(audio);
            audio.play();
        }
    });

    return (
        <div class="ConnectedView">
            <div class="ConnectedView_media">{sharedElements}</div>
            <ConnectedMessages
                class="ConnectedView_messages"
                localName={localName}
                peerName={peerName}
                chatMessages={chatMessages}
            />
            <ConnectedControls
                class="ConnectedView_controls"
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
                    if (mediaStream) {
                        for (const track of mediaStream.getTracks()) {
                            peer.peerConnection.addTrack(track, mediaStream);
                        }
                        userMediaStream.set(mediaStream);
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
