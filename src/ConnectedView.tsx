import Gooey, { calc, ClassComponent, collection, field } from '@srhazi/gooey';
import type { Collection, Component, EmptyProps, Field } from '@srhazi/gooey';

import { Button } from './Button';
import { ConnectedControls } from './ConnectedControls';
import { ConnectedMessages } from './ConnectedMessages';
import { ConnectedStatus } from './ConnectedStatus';
import type { Peer } from './Peer';
import { isEither, isExact, isNumber, isShape, isString } from './shape';
import type { CheckType } from './shape';
import { Timestamp } from './Timestamp';
import {
    isChatMessage,
    isChatRenameMessage,
    isLocalMessage,
    isWireChatMessage,
    isWireDataMessage,
    isWireRenameMessage,
} from './types';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component<{
    peer: Peer;
}> = ({ peer }, { onMount }) => {
    const chatMessages = collection<LocalMessage>([]);

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
                chatMessages={chatMessages}
            />
        </div>
    );
};
