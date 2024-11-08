/**
 * A handy way of asserting the shape of unknown values.
 */

type Check<T> = (val: unknown) => val is T;
export type CheckType<V> = V extends Check<infer A> ? A : never;

export const isNumber: Check<number> = (val): val is number =>
    typeof val === 'number';
export const isString: Check<string> = (val): val is string =>
    typeof val === 'string';
export const isBoolean: Check<boolean> = (val): val is boolean =>
    typeof val === 'boolean';

export function isExact<const T>(constant: T): (val: unknown) => val is T {
    return (val: unknown): val is T => val === constant;
}

export function isEither<X extends Check<any>[]>(
    ...checks: X
): (val: unknown) => val is CheckType<X[number]> {
    return (val: unknown): val is CheckType<X[number]> => {
        return checks.some((check) => check(val));
    };
}

export function isArray<T>(check: Check<T>): (val: unknown) => val is T[] {
    return (val: unknown): val is T[] => {
        return Array.isArray(val) && val.every((item) => check(item));
    };
}

export function isShape<T extends Record<string, Check<any>>>(
    shape: T
): Check<{ [Key in keyof T]: CheckType<T[Key]> }> {
    return (val: unknown): val is { [Key in keyof T]: CheckType<T[Key]> } => {
        if (typeof val !== 'object') {
            return false;
        }
        if (!val) {
            return false;
        }
        for (const [key, check] of Object.entries(shape)) {
            if (!(key in val)) {
                return false;
            }
            if (!check((val as any)[key])) {
                return false;
            }
        }
        return true;
    };
}
