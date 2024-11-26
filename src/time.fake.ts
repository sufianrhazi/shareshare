import type { TimeService } from './time';

export function makeFake(): TimeService {
    let now = 1727459579426; // arbitrarily 2024-09-27T17:52:59.426Z
    let immediates = new Set<() => void>();
    const timeouts = new Set<{ fn: () => void; next: number }>();
    const intervals = new Set<{ fn: () => void; next: number; ms: number }>();
    return {
        now: () => now,
        setTimeout: (fn, ms) => {
            if (ms === 0) {
                immediates.add(fn);
                return () => {
                    immediates.delete(fn);
                };
            }
            const handle = {
                fn,
                next: now + ms,
            };
            timeouts.add(handle);
            return () => {
                timeouts.delete(handle);
            };
        },
        setInterval: (fn, ms) => {
            const handle = {
                fn,
                next: now + ms,
                ms,
            };
            intervals.add(handle);
            return () => {
                intervals.delete(handle);
            };
        },
        sleep: (ms) => {
            now += ms;
            for (const timeout of timeouts) {
                if (timeout.next <= now) {
                    timeouts.delete(timeout);
                    timeout.fn();
                }
            }
            for (const interval of intervals) {
                let numRuns = 0;
                while (interval.next <= now) {
                    interval.next += interval.ms;
                    numRuns += 1;
                }
                for (let i = 0; i < numRuns; ++i) {
                    interval.fn();
                }
            }
            const runNow = immediates;
            immediates = new Set();
            for (const immediate of runNow) {
                immediate();
            }
            return Promise.resolve();
        },
        _set: (newNow: number) => {
            now = newNow;
        },
    };
}
