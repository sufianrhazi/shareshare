import Gooey, { calc } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import type { Peer } from './Peer';

import './ConnectedStatus.css';

export const ConnectedStatus: Component<{
    class: string;
    peer: Peer;
}> = ({ class: className, peer }, { onMount }) => {
    return (
        <div class={`${className} ConnectedStatus`}>
            Connection: <code>{peer.connectionState}</code>; Channel:{' '}
            <code>
                {calc(() => peer.channel.get()?.readyState.get()) ??
                    'no channel'}
            </code>
        </div>
    );
};
