import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { LoadingIcon } from './LoadingIcon';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

export const ConnectResponseAccepted: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = () => {
    return (
        <>
            <p>
                <Button primary disabled>
                    <LoadingIcon /> Connecting...
                </Button>
            </p>
            <p>
                Your friend has accepted the response token. Please hold while
                we try to connect...
            </p>
        </>
    );
};
