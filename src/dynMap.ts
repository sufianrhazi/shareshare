import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Dyn } from '@srhazi/gooey';

// TODO(gooey): add to standard library
export function dynMap<T, V>(val: Dyn<T>, fn: (a: T) => V): Dyn<V> {
    if (
        typeof val === 'object' &&
        val &&
        'get' in val &&
        'subscribe' in val &&
        typeof val.get === 'function' &&
        typeof val.subscribe === 'function'
    ) {
        return calc(() => fn(dynGet(val)));
    }
    return fn(val as T);
}
