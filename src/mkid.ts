export const mkid = (prefix: string) => {
    let id = 0;
    return () => `${prefix}${id++}`;
};
