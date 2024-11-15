import Gooey, { calc, dynGet, ref } from '@srhazi/gooey';
import type { Collection, Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';
import { ConnectedMessage } from './ConnectedMessage';
import type { LocalMessage } from './types';

import './ConnectedMessages.css';

export const ConnectedMessages: Component<{
    class?: string | undefined;
    isConnected: Dyn<boolean>;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    chatMessages: Collection<LocalMessage>;
}> = (
    { class: className, isConnected, localName, peerName, chatMessages },
    { onMount }
) => {
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
            {chatMessages.mapView((message) => (
                <ConnectedMessage
                    onMount={onMessageMounted}
                    localName={localName}
                    peerName={peerName}
                    message={message}
                />
            ))}
            {calc(
                () =>
                    !dynGet(isConnected) && (
                        <ConnectedMessage
                            onMount={onMessageMounted}
                            localName={localName}
                            peerName={peerName}
                            message={{ type: 'disconnected' }}
                        />
                    )
            )}
        </ul>
    );
};
