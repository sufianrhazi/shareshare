import Gooey, {
    calc,
    ClassComponent,
    collection,
    dynGet,
    field,
} from '@srhazi/gooey';
import type {
    Collection,
    Component,
    Dyn,
    EmptyProps,
    Field,
} from '@srhazi/gooey';

import { Timestamp } from './Timestamp';
import type { LocalMessage } from './types';

import './ConnectedMessages.css';

export const ConnectedMessages: Component<{
    class: string;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    chatMessages: Collection<LocalMessage>;
}> = ({ class: className, localName, peerName, chatMessages }, { onMount }) => {
    return (
        <ul class={`${className} ConnectedMessages`}>
            {chatMessages.mapView((msg) => {
                switch (msg.type) {
                    case 'chat': {
                        if (msg.from === 'you') {
                            return (
                                <li class="ConnectedMessages_msgOut">
                                    <Timestamp time={msg.sent} />{' '}
                                    <strong>{localName}</strong>: {msg.msg}
                                </li>
                            );
                        }
                        return (
                            <li class="ConnectedMessages_msgIn">
                                <Timestamp time={msg.sent} />{' '}
                                <strong>{peerName}</strong>: {msg.msg}
                            </li>
                        );
                    }
                    case 'name': {
                        if (msg.from === 'you') {
                            return (
                                <li class="ConnectedMessages_infoOut">
                                    <Timestamp time={msg.sent} />{' '}
                                    <strong>{msg.priorName}</strong> now known
                                    as <strong>{msg.name}</strong>
                                </li>
                            );
                        }
                        return (
                            <li class="ConnectedMessages_infoIn">
                                <Timestamp time={msg.sent} />{' '}
                                <strong>{msg.priorName}</strong> now known as{' '}
                                <strong>{msg.name}</strong>
                            </li>
                        );
                    }
                }
            })}
        </ul>
    );
};
