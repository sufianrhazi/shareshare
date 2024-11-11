export function union<A, B>(a: Set<A>, b: Set<B>): Set<A | B> {
    const either = new Set<A | B>();
    a.forEach((aItem) => either.add(aItem));
    b.forEach((bItem) => either.add(bItem));
    return either;
}

export function intersection<A>(a: Set<A>, b: Set<A>): Set<A> {
    const common = new Set<A>();
    a.forEach((aItem) => {
        if (b.has(aItem)) {
            common.add(aItem);
        }
    });
    return common;
}

export function difference<A>(a: Set<A>, b: Set<A>): Set<A> {
    const left = new Set<A>();
    a.forEach((aItem) => {
        if (!b.has(aItem)) {
            left.add(aItem);
        }
    });
    return left;
}
