import { AppState } from './AppState';
import { FileServiceReal } from './FileService.real';
import { PeerFake } from './Peer.fake';
import { register } from './svc';
import type { Services } from './svc';
import * as time from './time.fake';

export function _testReset(services: Partial<Services> = {}) {
    const peer = new PeerFake();
    const fileService = new FileServiceReal();
    const state = new AppState(fileService);
    state.setPeer(peer);
    const previousState = register({
        state,
        time: time.makeFake(),
        peer,
        file: fileService,
        ...services,
    });
    previousState?.state.dispose();
}
