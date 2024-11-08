import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import './Example.css';

export const Example: Component<{
    title: string;
    children?: JSX.Node | JSX.Node[];
}> = ({ title, children }) => (
    <div class="Example">
        <div class="Example_title">{title}</div>
        <div class="Example_content">{children}</div>
    </div>
);
