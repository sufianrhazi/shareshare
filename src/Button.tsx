import Gooey, { dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { dynMap } from './dynMap';

import './Button.css';

export const Button: Component<
    {
        primary?: Dyn<boolean | undefined>;
    } & JSX.IntrinsicElements['button']
> = ({ class: className, primary, children, ...props }) => (
    <button
        class={dynMap(
            className,
            (c) =>
                `Button ${c || ''} ${dynGet(primary) ? 'Button-primary' : ''}`
        )}
        {...props}
    >
        {children}
    </button>
);
