import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

export const ConnectStartHost: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    return (
        <>
            <p>
                <Button
                    primary
                    on:click={() => {
                        appState.dispatch({
                            event: 'create_invitation',
                        });
                        peer.start().catch(() => {
                            appState.dispatch({
                                event: 'create_invitation_failed',
                            });
                        });
                    }}
                >
                    Create an invitation link
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
