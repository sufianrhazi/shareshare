import Gooey, { mount } from '@srhazi/gooey';

import { AcceptApp } from './AcceptApp';

import './Main.css';

const app = document.getElementById('app');
if (!app) {
    alert('RUH ROH, no #app element found');
} else {
    mount(app, <AcceptApp />);
}
