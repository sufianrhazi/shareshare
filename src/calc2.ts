import { calc } from '@srhazi/gooey';

/**
 * A better calculation, with an optional cleanup function
 *
 * TODO: make part of Gooey.
 */
export function calc2<T>({
    fn,
    cleanup,
}: {
    fn: (prevValue?: T) => T;
    cleanup?: (prevValue: T) => void;
}) {
    let args: [T] | [] = [];
    const calculation = calc(() => {
        if (cleanup && args.length) {
            cleanup(args[0]);
        }
        const newValue = fn(...args);
        args = [newValue];
        return newValue;
    });
    // Oh, this is awkward! We need to change how Calculation works so it can be dropped...
    return calculation.subscribe(() => {});
}
