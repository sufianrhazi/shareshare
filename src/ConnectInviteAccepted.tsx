import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { LoadingIcon } from './LoadingIcon';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { assert } from './utils';

export const ConnectInviteAccepted: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'invite_accepted');
    return (
        <>
            <p>
                <Button primary disabled>
                    <LoadingIcon /> Generating response link...
                </Button>
            </p>
            <p>
                Creating a <strong>direct</strong> connection between two
                computers requires finding out the kind of router configuration
                you have. This may take longer than you'd expect to do this,
                please be patient.
            </p>
        </>
    );
};
