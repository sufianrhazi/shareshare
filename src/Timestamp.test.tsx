import Gooey, { mount } from '@srhazi/gooey';
import { assert, beforeEach, suite, test } from '@srhazi/gooey-test';

import { Timestamp } from './Timestamp';

let testRoot = document.getElementById('test-root')!;
beforeEach(() => {
    testRoot = document.getElementById('test-root')!;
});

suite('Timestamp', () => {
    test('it works', () => {
        mount(testRoot, <Timestamp time={Date.now()} />);
        assert.is('just now', testRoot.textContent);
    });
});
