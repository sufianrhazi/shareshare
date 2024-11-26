import { AppState } from './AppState';
import { RealPeer } from './Peer.real';
import { register } from './svc';
import * as time from './time.real';
import { makePromise } from './utils';

export function init(): Promise<void> {
    const peer = new RealPeer((toSend) => {
        switch (appState.activeView.get()) {
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
    });
    const appState = new AppState();
    appState.setPeer(peer);
    register({
        state: appState,
        time: time.makeReal(),
        peer,
    });
    return Promise.resolve();
}
