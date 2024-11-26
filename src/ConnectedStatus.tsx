import Gooey, { calc } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { svc } from './svc';

import './ConnectedStatus.css';

export const ConnectedStatus: Component<{
    class: string;
}> = ({ class: className }, { onMount }) => {
    return (
        <div class={`${className} ConnectedStatus`}>
            Connection: <code>{svc('peer').connectionState}</code>; Channel:{' '}
            <code>
                {calc(() => svc('peer').channel.get()?.readyState.get()) ??
                    'no channel'}
            </code>
        </div>
    );
};
