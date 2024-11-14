import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { CopyButton } from './CopyButton';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { assert } from './utils';

const makeResponseUrl = (msg: string) => {
    return `${window.location.origin}/accept.html#${msg}`;
};

export const ConnectResponseCreated: Component<{
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'response_created');
    const url = makeResponseUrl(state.responseMessage);
    return (
        <>
            <p>
                <CopyButton
                    primary
                    data={url}
                    onCopy={() => {
                        appState.dispatch({
                            event: 'copy_response',
                        });
                    }}
                >
                    Copy response link
                </CopyButton>
            </p>
            <p>
                This response link gives your friend information about how to
                contact your computer directly.
            </p>
        </>
    );
};
