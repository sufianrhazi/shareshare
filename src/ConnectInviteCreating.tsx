import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { LoadingIcon } from './LoadingIcon';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

export const ConnectInviteCreating: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = () => {
    return (
        <>
            <p>
                <Button primary disabled>
                    <LoadingIcon /> Generating invitation link...
                </Button>
            </p>
            <p>
                Creating a <strong>direct</strong> connection between two
                computers requires finding out the kind of router configuration
                you have. This may take a few moments, please be patient.
            </p>
        </>
    );
};
