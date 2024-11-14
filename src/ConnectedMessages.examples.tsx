import Gooey, { collection, field, mount } from '@srhazi/gooey';

import { ConnectedMessages } from './ConnectedMessages';
import { Example } from './Example';
import type { LocalMessage } from './types';

import './ChatMain.scss';

const localName = field('alice');
const peerName = field('bob');
mount(
    document.body,
    <>
        <Example title="Empty messages">
            <ConnectedMessages
                localName={localName}
                peerName={peerName}
                chatMessages={collection<LocalMessage>([])}
            />
        </Example>
        <Example title="First message (received)">
            <ConnectedMessages
                localName={localName}
                peerName={peerName}
                chatMessages={collection<LocalMessage>([
                    {
                        type: 'chat',
                        from: 'peer',
                        sent: Date.now(),
                        msg: 'Hello there!',
                    },
                ])}
            />
        </Example>
        <Example style="height: 100px" title="First message (sent)">
            <ConnectedMessages
                localName={localName}
                peerName={peerName}
                chatMessages={collection<LocalMessage>([
                    {
                        type: 'chat',
                        from: 'you',
                        sent: Date.now(),
                        msg: 'And hello there!',
                    },
                ])}
            />
        </Example>
        <Example style="height: 100px" title="A few messages">
            <ConnectedMessages
                localName={localName}
                peerName={peerName}
                chatMessages={collection<LocalMessage>([
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
                ])}
            />
        </Example>
    </>
);
