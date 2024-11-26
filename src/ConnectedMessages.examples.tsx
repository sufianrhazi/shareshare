import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { ConnectedMessages } from './ConnectedMessages';
import { Example } from './Example';
import { svc } from './svc';
import { _testReset } from './svc.reset';
import type { LocalMessage } from './types';

import './ChatMain.scss';

_testReset();
const allStates: { messages: LocalMessage[]; label: string }[] = [
    { messages: [], label: 'Empty messages' },
    {
        messages: [
            {
                type: 'chat',
                from: 'peer',
                sent: Date.now(),
                msg: 'Hello there!',
            },
        ],
        label: 'First message (received)',
    },
    {
        label: 'First message (sent)',
        messages: [
            {
                type: 'chat',
                from: 'you',
                sent: Date.now(),
                msg: 'And hello there!',
            },
        ],
    },
    {
        label: 'A few messages',
        messages: [
            {
                type: 'chat',
                from: 'peer',
                sent: Date.now(),
                msg: 'Hey',
            },
            {
                type: 'chat',
                from: 'you',
                sent: Date.now(),
                msg: "How's it going?",
            },
            {
                type: 'chat',
                from: 'you',
                sent: Date.now(),
                msg: "It's sorta cool this works!",
            },
            {
                type: 'name',
                from: 'peer',
                sent: Date.now(),
                priorName: 'robert',
                name: 'bob',
            },
            {
                type: 'chat',
                from: 'peer',
                sent: Date.now(),
                msg: "Awesome, that's better",
            },
        ],
    },
];
const activeIndex = field(0);
const isConnected = field(true);
mount(
    document.body,
    <>
        <Example title="Controls ">
            {allStates.map((targetState, index) => (
                <div>
                    <label>
                        <input
                            type="radio"
                            name="state"
                            checked={calc(() => index === activeIndex.get())}
                            on:click={(e, el) => {
                                if (el.checked) {
                                    svc('state').chatMessages.splice(
                                        0,
                                        svc('state').chatMessages.length,
                                        ...targetState.messages
                                    );
                                    activeIndex.set(index);
                                }
                            }}
                        />{' '}
                        {targetState.label}
                    </label>
                </div>
            ))}
        </Example>
        <Example title="Messages" style="height: 100px">
            <ConnectedMessages isConnected={isConnected} />
        </Example>
    </>
);
