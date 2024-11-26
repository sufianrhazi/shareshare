import { AppState } from './AppState';
import { RealPeer } from './Peer.real';
import { register } from './svc';
import * as time from './time.real';
import { makePromise } from './utils';

export function init(): Promise<void> {
    const appState = new AppState();
    register({
        state: new AppState(),
        time: time.makeReal(),
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
    });
    return Promise.resolve();
}
