import Gooey, { calc, ClassComponent, collection, field } from '@srhazi/gooey';
import type { Collection, Component, EmptyProps, Field } from '@srhazi/gooey';

import type { Peer } from './Peer';

import './ConnectedStatus.css';

export const ConnectedStatus: Component<{
    class: string;
    peer: Peer;
}> = ({ class: className, peer }, { onMount }) => {
    return (
        <div class={`${className} ConnectedStatus`}>
            Connection: <code>{peer.connectionState}</code>
        </div>
    );
};
