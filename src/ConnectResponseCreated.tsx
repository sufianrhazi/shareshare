import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { CopyButton } from './CopyButton';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { assert } from './utils';

export const ConnectResponseCreated: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'response_created');
    return (
        <>
            <p>
                <CopyButton
                    primary
                    data={state.responseMessage}
                    onCopy={() => {
                        appState.dispatch({
                            event: 'copy_response',
                        });
                    }}
                >
                    Copy response token
                </CopyButton>
            </p>
            <p>
                This response token gives your friend information about how to
                contact your computer directly. Send it back to them to connect.
            </p>
        </>
    );
};
