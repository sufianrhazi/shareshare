import Gooey, { dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';

import './Buttons.css';

export const Buttons: Component<{
    class?: string | undefined;
    children?: JSX.Node | JSX.Node[];
}> = ({ class: className, children }) => (
    <div class={classes('Buttons', className)}>{children}</div>
);
