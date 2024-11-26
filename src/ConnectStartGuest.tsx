import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { svc } from './svc';
import { assert } from './utils';

export const ConnectStartGuest: Component = () => {
    const state = svc('state').getState();
    assert(state.type === 'start_guest');
    return (
        <>
            <p>
                <Buttons>
                    <Button
                        primary
                        on:click={() => {
                            svc('state').dispatch({
                                event: 'accept_invitation',
                            });
                            svc('peer')
                                .accept(state.inviteMessage)
                                .then(() => {
                                    console.log('WHEN DOES THIS HAPPEN?');
                                })
                                .catch((e) => {
                                    console.error('Failed to accept', e);
                                });
                        }}
                    >
                        Accept your friend's invitation
                    </Button>
                    <Button
                        on:click={() => {
                            svc('state').dispatch({
                                event: 'reject_invitation',
                            });
                        }}
                    >
                        Reject this invitation
                    </Button>
                </Buttons>
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
