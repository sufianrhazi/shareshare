import type { AppState } from './AppState';
import type { FileService } from './FileService';
import type { PeerService } from './Peer';
import type { TimeService } from './time';
import { assert } from './utils';

export interface Services {
    time: TimeService;
    state: AppState;
    peer: PeerService;
    file: FileService;
}

let registry: Services | undefined;

export function register(services: Services) {
    const prev = registry;
    registry = services;
    return prev;
}

export function svc<T extends keyof Services>(which: T): Services[T] {
    assert(registry, 'svc not initialized');
    return registry[which];
}
