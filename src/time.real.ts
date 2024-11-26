import type { TimeService } from './time';

export function makeReal(): TimeService {
    return {
        now: () => Date.now(),
        setTimeout: (fn, ms) => {
            const handle = setTimeout(fn, ms);
            return () => {
                clearTimeout(handle);
            };
        },
        setInterval: (fn, ms) => {
            const handle = setInterval(fn, ms);
            return () => {
                clearInterval(handle);
            };
        },
        sleep: (ms) => {
            return new Promise<void>((resolve) => {
                setTimeout(() => resolve(), ms);
            });
        },
    };
}
