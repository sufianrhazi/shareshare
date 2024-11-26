import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { CopyButton } from './CopyButton';
import { SubwayStop } from './SubwayStop';
import { svc } from './svc';
import { TextArea } from './TextArea';
import { assert } from './utils';

const makeInviteUrl = (msg: string) => {
    return `${window.location.origin}${window.location.pathname}#${msg}`;
};

export const ConnectInviteCreated: Component = () => {
    const state = svc('state').getState();
    assert(state.type === 'invite_created');
    const url = makeInviteUrl(state.inviteMessage);
    const responseToken = field<string | undefined>(undefined);
    const isCopied = calc(() => {
        const s = svc('state').getState();
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
                            svc('state').dispatch({
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
                                svc('state').processResponse(responseMessage);
                                svc('state').dispatch({
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
