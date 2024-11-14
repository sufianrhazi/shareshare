import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { CopyButton } from './CopyButton';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { assert } from './utils';

const makeInviteUrl = (msg: string) => {
    return `${window.location.origin}/chat.html#${msg}`;
};

export const ConnectInviteCreated: Component<{
    peer: Peer;
    appState: StateMachine;
}> = ({ peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'invite_created');
    const url = makeInviteUrl(state.inviteMessage);
    return (
        <p>
            <CopyButton
                data={url}
                onCopyDone={() => {
                    appState.dispatch({
                        event: 'copy_invitation',
                    });
                }}
            >
                Copy invitation
            </CopyButton>
            <textarea
                on:copy={() => {
                    appState.dispatch({
                        event: 'copy_invitation',
                    });
                }}
                ref={(el) => {
                    if (el) {
                        el?.focus();
                        el?.select();
                    }
                }}
                readonly
            >
                {url}
            </textarea>
        </p>
    );
};
