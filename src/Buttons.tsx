import Gooey, { dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import './Buttons.css';

export const Buttons: Component<{
    children?: JSX.Node | JSX.Node[];
}> = ({ children }) => <div class="Buttons">{children}</div>;
