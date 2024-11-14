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
import type { Peer } from './Peer';
import type { StateMachine } from './StateMachine';

import './ChatContent.css';

export const ChatContent: Component<{
    processResponse: (response: string) => void;
    appState: StateMachine;
    peer: Peer;
}> = ({ processResponse, appState, peer }) => (
    <div
        class={classes('ChatContent', {
            'ChatContent-connected': calc(
                () => appState.getType() === 'connected'
            ),
        })}
    >
        <ContentSwitcher
            value={appState.type}
            args={{ processResponse, peer, appState }}
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
