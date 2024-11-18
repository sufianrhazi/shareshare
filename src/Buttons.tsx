import Gooey from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';

import './Buttons.css';

export const Buttons: Component<{
    class?: string | undefined;
    connected?: Dyn<boolean | undefined>;
    children?: JSX.Node | JSX.Node[];
}> = ({ class: className, connected, children }) => (
    <div
        class={classes('Buttons', className, {
            'Buttons-connected': connected,
        })}
    >
        {children}
    </div>
);
