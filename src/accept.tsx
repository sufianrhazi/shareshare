import { mount } from '@srhazi/gooey';

import { BroadcastManager } from './BroadcastManager';

const broadcastManager = new BroadcastManager('accept');

mount(document.getElementById('root')!, broadcastManager.render());
