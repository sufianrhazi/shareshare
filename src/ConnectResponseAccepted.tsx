import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

export const ConnectResponseAccepted: Component<{
    peer: Peer;
    appState: StateMachine;
}> = () => {
    return <p>TODO: what to show when the response is accepted?</p>;
};
