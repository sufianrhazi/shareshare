import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

export const ConnectInviteRejected: Component<{
    peer: Peer;
    appState: StateMachine;
}> = () => {
    return (
        <p>
            I get it, someone sent you a weird link. No worries, have a nice
            day!
        </p>
    );
};
