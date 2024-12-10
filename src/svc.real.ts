import { AppState } from './AppState';
import { FileServiceReal } from './FileService.real';
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
    const fileService = new FileServiceReal();
    const appState = new AppState(fileService);
    appState.setPeer(peer);
    register({
        state: appState,
        time: time.makeReal(),
        file: fileService,
        peer,
    });
    return Promise.resolve();
}
