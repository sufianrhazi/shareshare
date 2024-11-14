import Gooey from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';
import { Timestamp } from './Timestamp';
import type { LocalMessage } from './types';
import { assertExhausted } from './utils';

import './ConnectedMessage.css';

export const ConnectedMessage: Component<{
    class?: string | undefined;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    message: LocalMessage;
    onMount?: () => void;
}> = (
    {
        class: className,
        localName,
        peerName,
        message,
        onMount: onComponentMount,
    },
    { onMount }
) => {
    if (onComponentMount) {
        onMount(onComponentMount);
    }
    let content: JSX.Node;
    switch (message.type) {
        case 'chat': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />{' '}
                    <strong class="ConnectedMessage_name">
                        {message.from === 'you' ? localName : peerName}
                    </strong>
                    : {message.msg}
                </>
            );
            break;
        }
        case 'name': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />{' '}
                    <strong class="ConnectedMessage_name">
                        {message.priorName}
                    </strong>{' '}
                    now goes by{' '}
                    <strong class="ConnectedMessage_name">
                        {message.name}
                    </strong>
                </>
            );
            break;
        }
        case 'chatstart': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />{' '}
                    You're now sharing with{' '}
                    <strong class="ConnectedMessage_name">{peerName}</strong>
                </>
            );
            break;
        }
        default:
            assertExhausted(message);
    }
    return (
        <li
            class={classes('ConnectedMessage', {
                'ConnectedMessage-in': message.from === 'peer',
                'ConnectedMessage-out': message.from === 'you',
                'ConnectedMessage-info': message.type !== 'chat',
            })}
        >
            {content}
        </li>
    );
};
