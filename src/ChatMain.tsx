import Gooey, { mount } from '@srhazi/gooey';

import { ChatApp } from './ChatApp';
import { init } from './svc.real';

import './ChatMain.scss';

init()
    .then(() => {
        function onResize() {
            const width = document.documentElement.clientWidth;
            document.documentElement.classList.toggle(
                'viewport-xs',
                width < 320
            );
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
            document.documentElement.classList.toggle(
                'viewport-xl',
                1400 <= width
            );
        }
        window.addEventListener('resize', onResize);
        onResize();

        const app = document.getElementById('app');
        if (!app) {
            alert('RUH ROH, no #app element found');
        } else {
            mount(app, <ChatApp />);
        }
    })
    .catch((e) => {
        console.error('Error during initialization:', e);
        alert(`Error during initialization: ${e}`);
    });
