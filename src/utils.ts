export function assert<T>(
    pred: T,
    msg: string = 'Invariant violated',
    ...extra: any[]
): asserts pred {
    if (!pred) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        console.error(`Assertion Error: ${msg}`, ...extra);
        throw new Error(`Assertion Error: ${msg}`);
    }
}

export function assertResolves(
    val: Promise<unknown>,
    msg: string = 'Async failure'
): void {
    val.catch((e) => {
        console.error(`Assertion error: ${msg}`, e);
    });
}

export function assertExhausted(val: never, ...extra: any): never {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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

export function wrapError(e: any, msg?: string): Error {
    if (e instanceof Error) {
        return e;
    }
    return new Error(msg ?? 'Unknown error', { cause: e });
}
