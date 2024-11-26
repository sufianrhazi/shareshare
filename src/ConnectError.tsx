import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { svc } from './svc';
import { assert } from './utils';

export const ConnectError: Component = () => {
    const state = svc('state').getState();
    assert(state.type === 'error');
    return (
        <>
            <p>Uh oh, something went wrong!</p>
            <pre>{state.reason}</pre>
        </>
    );
};
