import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { LoadingIcon } from './LoadingIcon';

export const ConnectResponseAccepted: Component = () => {
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
