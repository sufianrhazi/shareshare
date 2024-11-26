import { flush } from '@srhazi/gooey';
import { assert, beforeEach, suite, test } from '@srhazi/gooey-test';

import { FileSendQueue } from './FileSendQueue';
import { svc } from './svc';
import { _testReset } from './svc.reset';

beforeEach(() => {
    _testReset();
});

suite('FileSendQueue', () => {
    test('files can be enqueued', async () => {
        svc('peer').connectionState.set('new'); // intentionally not connected

        const queue = new FileSendQueue();
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

        assert.is(0, queue.queue.length);
        assert.is('cancelled', handle.readyState);
    });

    test('files start sending when connected', async () => {
        svc('peer').connectionState.set('new');

        const queue = new FileSendQueue();
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

        svc('peer').connectionState.set('connected');
        flush();

        const sent = svc('peer')._testGetSentMessages?.();
        assert.deepEqual([], sent);
    });
});
