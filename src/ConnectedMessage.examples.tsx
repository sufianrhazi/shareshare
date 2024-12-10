import Gooey, { field, mount } from '@srhazi/gooey';

import { base64ToBytes } from './base64';
import { ConnectedMessage } from './ConnectedMessage';
import { Example } from './Example';
import { svc } from './svc';
import { _testReset } from './svc.reset';
import json from './testFiles.json';

import './ChatMain.scss';

_testReset();
const imageData = base64ToBytes(json.png);
const pngImage = new File([imageData], 'myimage.png', {
    type: 'image/png',
});
svc('file').setSentFileState('image-sent', {
    id: 'image-sent',
    file: pngImage,
    status: field('sent'),
    ackOffset: field(pngImage.size),
    sendOffset: field(pngImage.size),
    // eslint-disable-next-line require-yield, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment
    asyncIterator: (() => {
        throw new Error('not implemented');
    }) as any,
});
svc('file').setSentFileState('image-sending', {
    id: 'image-sending',
    file: pngImage,
    status: field('sending'),
    ackOffset: field(pngImage.size / 2),
    sendOffset: field(pngImage.size / 2),
    // eslint-disable-next-line require-yield, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment
    asyncIterator: (() => {
        throw new Error('not implemented');
    }) as any,
});

mount(
    document.body,
    <>
        <Example title="Text Message">
            <ul style="list-style: none; margin: 0; padding: 0">
                <ConnectedMessage
                    message={{
                        from: 'you',
                        type: 'chat',
                        sent: Date.now(),
                        msg: 'hey there',
                    }}
                />
                <ConnectedMessage
                    message={{
                        from: 'peer',
                        type: 'chat',
                        sent: Date.now(),
                        msg: "how's it going?",
                    }}
                />
            </ul>
        </Example>
        <Example title="Sending Image Message">
            <ul style="list-style: none; margin: 0; padding: 0">
                <ConnectedMessage
                    message={{
                        from: 'you',
                        type: 'file_send',
                        sent: Date.now(),
                        id: 'image-sending',
                    }}
                />
            </ul>
        </Example>
        <Example title="Sent Image Message">
            <ul style="list-style: none; margin: 0; padding: 0">
                <ConnectedMessage
                    message={{
                        from: 'you',
                        type: 'file_send',
                        sent: Date.now(),
                        id: 'image-sent',
                    }}
                />
            </ul>
        </Example>
    </>
);
