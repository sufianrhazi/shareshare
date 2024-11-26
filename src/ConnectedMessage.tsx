import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { classes } from './classes';
import { svc } from './svc';
import { Timestamp } from './Timestamp';
import type { LocalMessage } from './types';
import { isDirectionalMessage } from './types';
import { assertExhausted } from './utils';

import './ConnectedMessage.css';

export const ConnectedMessage: Component<{
    class?: string | undefined;
    message: LocalMessage;
    onMount?: () => void;
}> = (
    { class: className, message, onMount: onComponentMount },
    { onMount }
) => {
    console.log('RENDERING', message);
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
                        {message.from === 'you'
                            ? svc('state').localName
                            : svc('state').peerName}
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
                    <strong class="ConnectedMessage_name">
                        {svc('state').peerName}
                    </strong>
                </>
            );
            break;
        }
        case 'disconnected': {
            content = (
                <>
                    <Timestamp class="ConnectedMessage_ts" time={Date.now()} />{' '}
                    You are no longer connected.
                </>
            );
            break;
        }
        case 'file': {
            // TODO: actually render a the uploaded file and show progress
            content =
                message.from === 'you' ? (
                    <>
                        <Timestamp
                            class="ConnectedMessage_ts"
                            time={Date.now()}
                        />{' '}
                        Sending {message.fileName} (
                        {message.length.toLocaleString()} bytes)...
                    </>
                ) : (
                    <>
                        <Timestamp
                            class="ConnectedMessage_ts"
                            time={Date.now()}
                        />{' '}
                        Receiving {message.fileName} (
                        {message.length.toLocaleString()} bytes)...
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
                'ConnectedMessage-in':
                    isDirectionalMessage(message) && message.from === 'peer',
                'ConnectedMessage-out':
                    isDirectionalMessage(message) && message.from === 'you',
                'ConnectedMessage-info': message.type !== 'chat',
            })}
        >
            {content}
        </li>
    );
};
