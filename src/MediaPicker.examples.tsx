import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { Example } from './Example';
import { MediaPicker } from './MediaPicker';

import './Main.css';

mount(
    document.body,
    <Example title="Media Picker">
        <MediaPicker />
    </Example>
);
