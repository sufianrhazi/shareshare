import { AppState } from './AppState';
import { PeerFake } from './Peer.fake';
import { register } from './svc';
import type { Services } from './svc';
import * as time from './time.fake';

export function _testReset(services: Partial<Services> = {}) {
    register({
        state: new AppState(),
        time: time.makeFake(),
        peer: new PeerFake(),
        ...services,
    });
}
