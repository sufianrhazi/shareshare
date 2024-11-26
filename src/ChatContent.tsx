import Gooey, { calc } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { classes } from './classes';
import { ConnectedView } from './ConnectedView';
import { ConnectError } from './ConnectError';
import { ConnectInviteAccepted } from './ConnectInviteAccepted';
import { ConnectInviteCreated } from './ConnectInviteCreated';
import { ConnectInviteCreating } from './ConnectInviteCreating';
import { ConnectInviteRejected } from './ConnectInviteRejected';
import { ConnectResponseAccepted } from './ConnectResponseAccepted';
import { ConnectResponseCreated } from './ConnectResponseCreated';
import { ConnectStartGuest } from './ConnectStartGuest';
import { ConnectStartHost } from './ConnectStartHost';
import { ContentSwitcher } from './ContentSwitcher';
import { svc } from './svc';

import './ChatContent.css';

export const ChatContent: Component = () => (
    <div
        class={classes('ChatContent', {
            'ChatContent-connected': calc(
                () => svc('state').activeView.get() === 'connected'
            ),
        })}
    >
        <ContentSwitcher
            value={svc('state').activeView}
            args={{}}
            content={{
                error: ConnectError,
                invite_created: ConnectInviteCreated,
                invite_rejected: ConnectInviteRejected,
                response_accepted: ConnectResponseAccepted,
                start_guest: ConnectStartGuest,
                start_host: ConnectStartHost,
                invite_accepted: ConnectInviteAccepted,
                response_created: ConnectResponseCreated,
                invite_creating: ConnectInviteCreating,
                connected: ConnectedView,
            }}
        />
    </div>
);
