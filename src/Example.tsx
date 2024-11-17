import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import './Example.css';

let initialized = false;
if (!initialized) {
    initialized = true;
    const onResize = () => {
        const width = document.documentElement.clientWidth;
        document.documentElement.classList.toggle('viewport-xs', width < 320);
        document.documentElement.classList.toggle(
            'viewport-sm',
            320 <= width && width < 576
        );
        document.documentElement.classList.toggle(
            'viewport-md',
            576 <= width && width < 992
        );
        document.documentElement.classList.toggle(
            'viewport-lg',
            992 <= width && width < 1400
        );
        document.documentElement.classList.toggle('viewport-xl', 1400 <= width);
    };
    window.addEventListener('resize', onResize);
    onResize();
}

export const Example: Component<{
    title: string;
    style?: string | undefined;
    contentStyle?: string | undefined;
    children?: JSX.Node | JSX.Node[];
}> = ({ title, contentStyle, style, children }) => (
    <div style={style} class="Example">
        <div class="Example_title">{title}</div>
        <div style={contentStyle} class="Example_content">
            {children}
        </div>
    </div>
);
