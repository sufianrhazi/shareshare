import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import './Example.css';

export const Example: Component<{
    title: string;
    style?: string | undefined;
    children?: JSX.Node | JSX.Node[];
}> = ({ title, style, children }) => (
    <div style={style} class="Example">
        <div class="Example_title">{title}</div>
        <div class="Example_content">{children}</div>
    </div>
);
