import { assert, suite, test } from '@srhazi/gooey-test';

import type { TimeService } from './time';
import { makeFake } from './time.fake';
import { makeReal } from './time.real';

function makeSuite(which: string, time: TimeService) {
    suite(`time ${which}`, () => {
        test('now returns a time that changes after sleeping', async () => {
            const sleepTime = 100;
            const before = time.now();
            await time.sleep(sleepTime);
            const after = time.now();
            const elapsed = after - before;

            // Because real time is elapsing when our code is executing, we can
            // only check that the clock advanced by approximately the amount
            // of time we slept for.
            const jitter = Math.abs(elapsed - sleepTime);
            assert.lessThan(jitter, 10);
        });

        test('setTimeout schedules events in the future', async () => {
            let calls = 0;

            const cancel = time.setTimeout(() => {
                calls += 1;
            }, 50);

            assert.is(0, calls);
            await time.sleep(30);
            assert.is(0, calls);
            await time.sleep(30);
            assert.is(1, calls);
            await time.sleep(30);
            assert.is(1, calls);
            await time.sleep(30);
            assert.is(1, calls);

            cancel(); // clean up
        });

        test('setTimeout can be cancelled', async () => {
            let calls = 0;

            const cancel = time.setTimeout(() => {
                calls += 1;
            }, 50);

            assert.is(0, calls);
            await time.sleep(30);
            assert.is(0, calls);
            cancel();
            await time.sleep(30);
            assert.is(0, calls);
            await time.sleep(30);
            assert.is(0, calls);
        });

        test('setInterval schedules continuous events', async () => {
            let calls = 0;

            const cancel = time.setInterval(() => {
                calls += 1;
            }, 50);

            assert.is(0, calls);
            await time.sleep(30); // 30
            assert.is(0, calls);
            await time.sleep(30); // 60
            assert.is(1, calls);
            await time.sleep(30); // 90
            assert.is(1, calls);
            await time.sleep(30); // 120
            assert.is(2, calls);

            cancel();
        });

        test('setInterval triggers multiple times when sleeping', async () => {
            let calls = 0;

            const cancel = time.setInterval(() => {
                calls += 1;
            }, 50);

            assert.is(0, calls);
            await time.sleep(120);
            assert.is(2, calls);

            cancel();
        });

        test('setInterval can be cancelled', async () => {
            let calls = 0;

            const cancel = time.setInterval(() => {
                calls += 1;
            }, 50);

            assert.is(0, calls);
            cancel();
            await time.sleep(120);
            assert.is(0, calls);

            cancel();
        });
    });
}

makeSuite('fake', makeFake());
makeSuite('real', makeReal());
