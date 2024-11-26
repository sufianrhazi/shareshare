import { flush } from '@srhazi/gooey';
import { assert, beforeEach, suite, test } from '@srhazi/gooey-test';

import {
    encodeFileAckMessage,
    encodeFilePushMessage,
    FileSendQueue,
} from './FileSendQueue';
import { svc } from './svc';
import { _testReset } from './svc.reset';

beforeEach(() => {
    _testReset();
});

suite('FileSendQueue', () => {
    test('files can be enqueued', async () => {
        svc('peer').connectionState.set('new'); // intentionally not connected

        using queue = new FileSendQueue(svc('peer'));
        const handle = await queue.sendFile({
            fileName: 'test.txt',
            contentType: 'text/plain',
            blob: new Blob(['testing']),
        });
        assert.is(1, queue.queue.length);
        assert.is('test.txt', queue.queue[0].fileName);
        assert.is('text/plain', queue.queue[0].contentType);
        assert.deepEqual(
            Array.from('testing').map((c) => c.codePointAt(0)),
            Array.from(queue.queue[0].bytes)
        );
        assert.is(7, queue.queue[0].size);
        assert.is(0, queue.queue[0].sentOffset.get());
        assert.is(0, queue.queue[0].ackOffset.get());
        assert.is('queued', queue.queue[0].readyState.get());

        handle.cancel();

        assert.is(1, queue.queue.length);
        assert.is('end:cancelled', handle.readyState);
    });

    test('files start sending when connected', async () => {
        svc('peer').connectionState.set('new');

        using queue = new FileSendQueue(svc('peer'));
        await queue.sendFile({
            fileName: 'test.txt',
            contentType: 'text/plain',
            blob: new Blob(['testing']),
        });
        assert.is(1, queue.queue.length);
        assert.is('test.txt', queue.queue[0].fileName);
        assert.is('text/plain', queue.queue[0].contentType);
        assert.deepEqual(
            Array.from('testing').map((c) => c.codePointAt(0)),
            Array.from(queue.queue[0].bytes)
        );
        assert.is(7, queue.queue[0].size);
        assert.is(0, queue.queue[0].sentOffset.get());
        assert.is(0, queue.queue[0].ackOffset.get());
        assert.is('queued', queue.queue[0].readyState.get());

        svc('peer').connectionState.set('connected');
        flush();

        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: 'file_0',
                    size: 7,
                    offset: 0,
                    base64: 'dGVzdGluZw==',
                }),
            ],
            svc('peer')._testGetSentMessages?.()
        );
        assert.is('sent', queue.queue[0].readyState.get());

        svc('peer')._testReceiveMessage?.(
            encodeFileAckMessage({
                type: 'file:ack',
                id: 'file_0',
                offset: 7,
            })
        );
        flush();

        assert.is('end:received', queue.queue[0].readyState.get());
    });

    test('files start sending immediately if connected', async () => {
        assert.is('connected', svc('peer').connectionState.get());

        using queue = new FileSendQueue(svc('peer'));
        await queue.sendFile({
            fileName: 'test.txt',
            contentType: 'text/plain',
            blob: new Blob(['testing']),
        });
        assert.is(1, queue.queue.length);
        assert.is('test.txt', queue.queue[0].fileName);
        assert.is('text/plain', queue.queue[0].contentType);
        assert.deepEqual(
            Array.from('testing').map((c) => c.codePointAt(0)),
            Array.from(queue.queue[0].bytes)
        );
        assert.is(7, queue.queue[0].size);
        assert.is(7, queue.queue[0].sentOffset.get());
        assert.is(0, queue.queue[0].ackOffset.get());
        assert.is('sent', queue.queue[0].readyState.get());

        const sent = svc('peer')._testGetSentMessages?.();
        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: 'file_0',
                    size: 7,
                    offset: 0,
                    base64: 'dGVzdGluZw==',
                }),
            ],
            sent
        );
        assert.is('sent', queue.queue[0].readyState.get());

        svc('peer')._testReceiveMessage?.(
            encodeFileAckMessage({
                type: 'file:ack',
                id: 'file_0',
                offset: 7,
            })
        );
        flush();

        assert.is('end:received', queue.queue[0].readyState.get());
    });

    test('subsequent files continue sending if connected', async () => {
        assert.is('connected', svc('peer').connectionState.get());

        using queue = new FileSendQueue(svc('peer'));
        await queue.sendFile({
            fileName: 'first.txt',
            contentType: 'text/plain',
            blob: new Blob(['testing']),
        });
        await queue.sendFile({
            fileName: 'second.txt',
            contentType: 'text/plain',
            blob: new Blob(['again']),
        });
        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(7, queue.queue[0].sentOffset.get());
        assert.is(0, queue.queue[0].ackOffset.get());
        assert.is('sent', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(0, queue.queue[1].sentOffset.get());
        assert.is(0, queue.queue[1].ackOffset.get());
        assert.is('queued', queue.queue[1].readyState.get());

        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 0,
                    base64: 'dGVzdGluZw==',
                }),
            ],
            svc('peer')._testGetSentMessages?.()
        );

        svc('peer')._testReceiveMessage?.(
            encodeFileAckMessage({
                type: 'file:ack',
                id: 'file_0',
                offset: 7,
            })
        );
        flush();

        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(7, queue.queue[0].sentOffset.get());
        assert.is(7, queue.queue[0].ackOffset.get());
        assert.is('end:received', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(5, queue.queue[1].sentOffset.get());
        assert.is(0, queue.queue[1].ackOffset.get());
        assert.is('sent', queue.queue[1].readyState.get());

        svc('peer')._testReceiveMessage?.(
            encodeFileAckMessage({
                type: 'file:ack',
                id: queue.queue[1].id,
                offset: queue.queue[1].size,
            })
        );
        flush();

        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(7, queue.queue[0].sentOffset.get());
        assert.is(7, queue.queue[0].ackOffset.get());
        assert.is('end:received', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(5, queue.queue[1].sentOffset.get());
        assert.is(5, queue.queue[1].ackOffset.get());
        assert.is('end:received', queue.queue[1].readyState.get());
    });

    test('subsequent files continue sending if cancelled', async () => {
        assert.is('connected', svc('peer').connectionState.get());

        using queue = new FileSendQueue(svc('peer'), 1); // send one byte at a time
        const handle1 = await queue.sendFile({
            fileName: 'first.txt',
            contentType: 'text/plain',
            blob: new Blob(['testing']),
        });
        await queue.sendFile({
            fileName: 'second.txt',
            contentType: 'text/plain',
            blob: new Blob(['again']),
        });
        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(1, queue.queue[0].sentOffset.get());
        assert.is(0, queue.queue[0].ackOffset.get());
        assert.is('sending', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(0, queue.queue[1].sentOffset.get());
        assert.is(0, queue.queue[1].ackOffset.get());
        assert.is('queued', queue.queue[1].readyState.get());

        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 0,
                    base64: 'dA==',
                }),
            ],
            svc('peer')._testGetSentMessages?.()
        );

        svc('peer')._testReceiveMessage?.(
            encodeFileAckMessage({
                type: 'file:ack',
                id: 'file_0',
                offset: 1,
            })
        );
        flush();

        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(2, queue.queue[0].sentOffset.get());
        assert.is(1, queue.queue[0].ackOffset.get());
        assert.is('sending', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(0, queue.queue[1].sentOffset.get());
        assert.is(0, queue.queue[1].ackOffset.get());
        assert.is('queued', queue.queue[1].readyState.get());

        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 0,
                    base64: 'dA==',
                }),
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 1,
                    base64: 'ZQ==',
                }),
            ],
            svc('peer')._testGetSentMessages?.()
        );

        handle1.cancel();
        flush();

        assert.is(2, queue.queue.length);
        assert.is('first.txt', queue.queue[0].fileName);
        assert.is(2, queue.queue[0].sentOffset.get());
        assert.is(1, queue.queue[0].ackOffset.get());
        assert.is('end:cancelled', queue.queue[0].readyState.get());
        assert.is('second.txt', queue.queue[1].fileName);
        assert.is(1, queue.queue[1].sentOffset.get());
        assert.is(0, queue.queue[1].ackOffset.get());
        assert.is('sending', queue.queue[1].readyState.get());

        assert.deepEqual(
            [
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 0,
                    base64: 'dA==',
                }),
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[0].id,
                    size: 7,
                    offset: 1,
                    base64: 'ZQ==',
                }),
                encodeFilePushMessage({
                    type: 'file:chunk',
                    id: queue.queue[1].id,
                    size: 5,
                    offset: 0,
                    base64: 'YQ==',
                }),
            ],
            svc('peer')._testGetSentMessages?.()
        );
    });
});
