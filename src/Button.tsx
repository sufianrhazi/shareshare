import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';

import './Button.css';

export type ButtonSize = 'sm' | 'md';

export const Button: Component<
    {
        size?: Dyn<ButtonSize | undefined>;
        primary?: Dyn<boolean | undefined>;
    } & JSX.IntrinsicElements['button']
> = ({ class: className, primary, size, children, ...props }) => (
    <button
        class={classes(className, 'Button', {
            'Button-primary': primary,
            'Button-sm': calc(() => dynGet(size) === 'sm'),
        })}
        type="button"
        {...props}
    >
        {children}
    </button>
);
