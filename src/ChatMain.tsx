import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { ChatApp } from './ChatApp';

import './Main.css';

const app = document.getElementById('app');
if (!app) {
    alert('RUH ROH, no #app element found');
} else {
    mount(app, <ChatApp />);
}
