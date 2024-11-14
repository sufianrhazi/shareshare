import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { assert } from './utils';

export const ConnectError: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'error');
    return (
        <>
            <p>Uh oh, something went wrong!</p>
            <pre>{state.reason}</pre>
        </>
    );
};
