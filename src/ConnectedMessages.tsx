import Gooey, { calc, dynGet, ref } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';
import { ConnectedMessage } from './ConnectedMessage';
import { svc } from './svc';

import './ConnectedMessages.css';

export const ConnectedMessages: Component<{
    class?: string | undefined;
    isConnected: Dyn<boolean>;
}> = ({ class: className, isConnected }, { onMount }) => {
    const ulRef = ref<HTMLUListElement>();
    let atBottom = true;
    const onMessageMounted = () => {
        if (atBottom && ulRef.current) {
            ulRef.current.scrollTop =
                ulRef.current.scrollHeight - ulRef.current.clientHeight;
        }
    };
    return (
        <ul
            ref={ulRef}
            on:scroll={(e, el) => {
                atBottom = el.scrollTop >= el.scrollHeight - el.clientHeight;
                console.log('bottom', atBottom);
            }}
            class={classes(className, 'ConnectedMessages')}
        >
            {svc('state').chatMessages.mapView((message) => (
                <ConnectedMessage
                    onMount={onMessageMounted}
                    message={message}
                />
            ))}
            {calc(
                () =>
                    !dynGet(isConnected) && (
                        <ConnectedMessage
                            onMount={onMessageMounted}
                            message={{ type: 'disconnected' }}
                        />
                    )
            )}
        </ul>
    );
};
