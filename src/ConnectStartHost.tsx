import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { svc } from './svc';

export const ConnectStartHost: Component = () => {
    return (
        <>
            <p>
                <Button
                    primary
                    on:click={() => {
                        svc('state').dispatch({
                            event: 'create_invitation',
                        });
                        try {
                            svc('peer').start();
                        } catch (e) {
                            console.error('Unable to create invitation', e);
                            svc('state').dispatch({
                                event: 'create_invitation_failed',
                            });
                        }
                    }}
                >
                    Create an invitation link
                </Button>
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
