export interface TimeService {
    now: () => number;
    setTimeout: (fn: () => void, ms: number) => () => void;
    setInterval: (fn: () => void, ms: number) => () => void;
    sleep: (ms: number) => void;
    _set?: (now: number) => void;
}
