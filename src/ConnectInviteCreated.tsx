import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { CopyButton } from './CopyButton';
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';
import { SubwayStop } from './SubwayStop';
import { TextArea } from './TextArea';
import { assert } from './utils';

const makeInviteUrl = (msg: string) => {
    return `${window.location.origin}${window.location.pathname}#${msg}`;
};

export const ConnectInviteCreated: Component<{
    processResponse: (response: string) => void;
    peer: Peer;
    appState: StateMachine;
}> = ({ processResponse, peer, appState }) => {
    const state = appState.getState();
    assert(state.type === 'invite_created');
    const url = makeInviteUrl(state.inviteMessage);
    const responseToken = field<string | undefined>(undefined);
    const isCopied = calc(() => {
        const s = appState.getState();
        assert(s.type === 'invite_created');
        return s.copied;
    });
    return (
        <>
            <p>
                <SubwayStop
                    icon={calc(() => (isCopied.get() ? 'check' : 'arrowRight'))}
                    status={calc(() => (isCopied.get() ? 'success' : 'warn'))}
                >
                    <CopyButton
                        primary={calc(() => !isCopied.get())}
                        data={url}
                        onCopy={() => {
                            appState.dispatch({
                                event: 'copy_invitation',
                            });
                        }}
                    >
                        Copy invitation link
                    </CopyButton>
                </SubwayStop>
            </p>
            <p>
                Send this link to your friend. They should accept and send you
                back a response token.
            </p>
            <p>
                <TextArea
                    value={responseToken}
                    onInput={(newValue) => responseToken.set(newValue)}
                >
                    Place their response token here:
                </TextArea>
            </p>
            <p>
                <SubwayStop
                    icon={calc(() => (isCopied.get() ? 'arrowRight' : 'minus'))}
                    status={calc(() => (isCopied.get() ? 'warn' : 'info'))}
                >
                    <Button
                        primary={isCopied}
                        disabled={calc(() => !responseToken.get()?.trim())}
                        on:click={() => {
                            const responseMessage = responseToken.get();
                            if (responseMessage) {
                                processResponse(responseMessage);
                                appState.dispatch({
                                    event: 'receive_and_accept_response',
                                    responseMessage,
                                });
                            }
                        }}
                    >
                        Accept response token
                    </Button>
                </SubwayStop>
            </p>
        </>
    );
};
