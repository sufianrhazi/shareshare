export function assert<T>(
    pred: T,
    msg: string = 'Invariant violated',
    ...extra: any[]
): asserts pred {
    if (!pred) {
        console.error(`Assertion Error: ${msg}`, ...extra);
        throw new Error(`Assertion Error: ${msg}`);
    }
}

export function assertExhausted(val: never, ...extra: any): never {
    console.error('Value not handled', val, ...extra);
    throw new Error('Value not handled');
}

export function makePromise<T>() {
    let resolve: undefined | ((val: T) => void);
    let reject: undefined | ((err: any) => void);
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    assert(resolve);
    assert(reject);
    return { promise, resolve, reject };
}

export type PromiseHandle<T> = ReturnType<typeof makePromise<T>>;
