import { AppState } from './AppState';
import { PeerFake } from './Peer.fake';
import { register } from './svc';
import type { Services } from './svc';
import * as time from './time.fake';

export function _testReset(services: Partial<Services> = {}) {
    const peer = new PeerFake();
    const state = new AppState();
    state.setPeer(peer);
    const previousState = register({
        state,
        time: time.makeFake(),
        peer,
        ...services,
    });
    previousState?.state.dispose();
}
