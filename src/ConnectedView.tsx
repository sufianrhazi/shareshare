import Gooey, { calc, ClassComponent, collection, field } from '@srhazi/gooey';
import type { Collection, Component, EmptyProps, Field } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedMessages } from './ConnectedMessages';
import { ConnectedStatus } from './ConnectedStatus';
import type { Peer } from './Peer';
import { isWireChatMessage, isWireRenameMessage } from './types';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component<{
    peer: Peer;
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
        if (typeof message.data === 'string') {
            let parsed: WireDataMessage;
            try {
                parsed = JSON.parse(message.data);
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
        }
    });

    onMount(() => {});
    return (
        <div class="ConnectedView">
            <ConnectedStatus class="ConnectedView_status" peer={peer} />
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
                    peer.channel?.send(JSON.stringify(wireMessage));
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
                    peer.channel?.send(JSON.stringify(wireMessage));
                }}
            />
        </div>
    );
};
