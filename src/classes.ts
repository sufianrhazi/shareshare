import type { Calculation, Dyn } from '@srhazi/gooey';
import { calc, dynGet } from '@srhazi/gooey';

export function classes(
    ...names: (
        | string
        | null
        | undefined
        | Dyn<string | undefined>
        | Record<string, Dyn<boolean | undefined>>
    )[]
): Calculation<string> {
    return calc(() => {
        const classNames: string[] = [];
        for (const name of names) {
            if (typeof name === 'string') {
                classNames.push(name);
            } else if (
                name &&
                'get' in name &&
                typeof name.get === 'function' &&
                'subscribe' in name &&
                typeof name.subscribe === 'function'
            ) {
                const read = dynGet(name as Dyn<string | undefined>);
                if (read) {
                    // TODO(gooey): this is gross, need a way to check if a value is a Dyn
                    classNames.push(read);
                }
            } else if (name) {
                for (const [key, val] of Object.entries(name)) {
                    if (dynGet(val)) {
                        classNames.push(key);
                    }
                }
            }
        }
        return classNames.join(' ');
    });
}
