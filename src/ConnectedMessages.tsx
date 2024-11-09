import Gooey from '@srhazi/gooey';
import type { Collection, Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';
import { ConnectedMessage } from './ConnectedMessage';
import type { LocalMessage } from './types';

import './ConnectedMessages.css';

export const ConnectedMessages: Component<{
    class?: string | undefined;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    chatMessages: Collection<LocalMessage>;
}> = ({ class: className, localName, peerName, chatMessages }, { onMount }) => {
    return (
        <ul class={classes(className, 'ConnectedMessages')}>
            {chatMessages.mapView((message) => (
                <ConnectedMessage
                    localName={localName}
                    peerName={peerName}
                    message={message}
                />
            ))}
        </ul>
    );
};
