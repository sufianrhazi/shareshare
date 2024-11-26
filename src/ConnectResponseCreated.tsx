import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { CopyButton } from './CopyButton';
import { svc } from './svc';
import { assert } from './utils';

export const ConnectResponseCreated: Component = () => {
    const state = svc('state').getState();
    assert(state.type === 'response_created');
    return (
        <>
            <p>
                <CopyButton
                    primary
                    data={state.responseMessage}
                    onCopy={() => {
                        svc('state').dispatch({
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
