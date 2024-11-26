import { RealPeer } from './Peer.real';
import { StateMachine } from './StateMachine';
import { register } from './svc';
import type { Services } from './svc';
import * as time from './time.fake';
import { makePromise } from './utils';

export function _testReset(services: Partial<Services> = {}) {
    const appState = new StateMachine();
    register({
        state: appState,
        time: time.makeFake(),
        peer: new RealPeer((toSend) => {
            switch (appState.getType()) {
                case 'invite_creating':
                    appState.dispatch({
                        event: 'create_invitation_ok',
                        inviteMessage: toSend,
                    });
                    break;
                case 'invite_accepted':
                    appState.dispatch({
                        event: 'create_response',
                        responseMessage: toSend,
                    });
            }
            appState.peerResponsePromise = makePromise<string>();
            return appState.peerResponsePromise.promise;
        }),
        ...services,
    });
}
