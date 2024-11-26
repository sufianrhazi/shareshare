import Gooey, { mount } from '@srhazi/gooey';
import { assert, beforeEach, suite, test } from '@srhazi/gooey-test';

import { svc } from './svc';
import { _testReset } from './svc.reset';
import { Timestamp } from './Timestamp';

beforeEach(() => {
    _testReset();
});

let testRoot = document.getElementById('test-root')!;
beforeEach(() => {
    testRoot = document.getElementById('test-root')!;
});

suite('Timestamp', () => {
    test('it works', () => {
        mount(testRoot, <Timestamp time={svc('time').now()} />);
        assert.is(
            '<time datetime="2024-09-27T17:52:59.426Z" title="9/27/2024, 1:52:59 PM" class="Timestamp"><tt>Fri Sep 27</tt><span class="Timestamp_copy">2024-09-27T17:52:59.426Z</span></time>',
            testRoot.innerHTML
        );
    });
});
