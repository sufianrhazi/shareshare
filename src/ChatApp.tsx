import Gooey, { calc } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { BroadcastManager } from './BroadcastManager';
import type { CircleIconStatus } from './CircleIcon';
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
import { Peer } from './Peer';
import { StateMachine } from './StateMachine';
import { SubwayStop } from './SubwayStop';
import { makePromise } from './utils';

import './ChatApp.css';

export const ChatApp: Component = () => {
    const appState = new StateMachine();

    const broadcastManager = new BroadcastManager('chat');

    const stepCreate = calc((): { status: CircleIconStatus } => {
        switch (appState.getType()) {
            case 'start_host':
                return { status: 'info' };
            case 'invite_creating':
                return { status: 'warn' };
            case 'invite_created':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepInvite = calc((): { status: CircleIconStatus } => {
        switch (appState.getType()) {
            case 'start_host':
            case 'invite_creating':
                return { status: 'info' };
            case 'invite_created':
                return { status: 'warn' };
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });

    const stepAccept = calc((): { status: CircleIconStatus } => {
        switch (appState.getType()) {
            case 'start_guest':
                return { status: 'info' };
            case 'invite_accepted':
                return { status: 'warn' };
            case 'response_created':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepRespond = calc((): { status: CircleIconStatus } => {
        switch (appState.getType()) {
            case 'start_guest':
            case 'invite_accepted':
                return { status: 'info' };
            case 'response_created':
                return { status: 'warn' };
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepConnect = calc((): { status: CircleIconStatus } => {
        switch (appState.getType()) {
            case 'start_host':
            case 'start_guest':
            case 'invite_accepted':
            case 'invite_rejected':
            case 'invite_creating':
            case 'invite_created':
            case 'response_created':
                return { status: 'info' };
            case 'response_accepted':
                return { status: 'warn' };
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });

    let responsePromise = makePromise<string>();
    // TODO: should peer be split into a "host" and "guest" peer for ease of understanding?
    const peer = new Peer((toSend) => {
        switch (appState.getType()) {
            case 'invite_creating':
                appState.dispatch({
                    event: 'create_invitation_ok',
                    inviteMessage: toSend,
                });
                break;
            case 'invite_accepted':
                appState.dispatch({
                    event: 'create_response',
                    responseMessage: toSend,
                });
        }
        responsePromise = makePromise<string>();
        return responsePromise.promise;
    });
    peer.connected().then(() => {
        appState.dispatch({
            event: 'establish_connection',
        });
    });

    broadcastManager.onAccept(async (msg) => {
        appState.dispatch({
            event: 'receive_and_accept_response',
            responseMessage: msg,
        });
        responsePromise.resolve(msg);
    });

    return (
        <div class="ChatApp">
            <div class="ChatApp_title">
                <h1>Share Share</h1>
                {calc(
                    () =>
                        !appState.isPaired.get() &&
                        appState.isHost.get() && (
                            <div>
                                Share messages/files/media with a friend{' '}
                                <strong>directly</strong>.
                            </div>
                        )
                )}
                {calc(
                    () =>
                        !appState.isPaired.get() &&
                        appState.isGuest.get() && (
                            <div>
                                A friend wants to share messages/files/media
                                with you <strong>directly</strong>.
                            </div>
                        )
                )}
            </div>
            <div class="ChatApp_status">
                {calc(() => {
                    if (
                        broadcastManager.localTabs.some(
                            (localTab) => localTab.role === 'chat'
                        )
                    ) {
                        return (
                            <p>
                                <strong>Hey!</strong> It looks like you have
                                multiple tabs of this page open. This app only
                                works when you have one tab open -- please close
                                the other tabs.
                            </p>
                        );
                    }
                })}
                {calc(
                    () =>
                        appState.isGuest.get() && (
                            <>
                                <p>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepAccept.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepAccept.get().status === 'warn'
                                                ? undefined
                                                : '1'
                                        )}
                                        status={calc(
                                            () => stepAccept.get().status
                                        )}
                                    >
                                        Accept the invitation
                                    </SubwayStop>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepRespond.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepRespond.get().status === 'warn'
                                                ? undefined
                                                : '2'
                                        )}
                                        status={calc(
                                            () => stepRespond.get().status
                                        )}
                                    >
                                        Send a respnose back to your friend
                                    </SubwayStop>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepConnect.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepConnect.get().status === 'warn'
                                                ? undefined
                                                : '3'
                                        )}
                                        status={calc(
                                            () => stepConnect.get().status
                                        )}
                                    >
                                        When confirmed, you're good to go!
                                    </SubwayStop>
                                </p>
                            </>
                        )
                )}
                {calc(
                    () =>
                        appState.isHost.get() && (
                            <>
                                <p>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepCreate.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepCreate.get().status === 'warn'
                                                ? undefined
                                                : '1'
                                        )}
                                        status={calc(
                                            () => stepCreate.get().status
                                        )}
                                    >
                                        <strong>
                                            Create an invitation link
                                        </strong>
                                    </SubwayStop>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepInvite.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepInvite.get().status === 'warn'
                                                ? undefined
                                                : '2'
                                        )}
                                        status={calc(
                                            () => stepInvite.get().status
                                        )}
                                    >
                                        Send it to a friend, they send an
                                        acceptance link back
                                    </SubwayStop>
                                    <SubwayStop
                                        icon={calc(() =>
                                            stepConnect.get().status === 'warn'
                                                ? 'arrowRight'
                                                : undefined
                                        )}
                                        letter={calc(() =>
                                            stepConnect.get().status === 'warn'
                                                ? undefined
                                                : '3'
                                        )}
                                        status={calc(
                                            () => stepConnect.get().status
                                        )}
                                    >
                                        Confirm it and you're good to go!
                                    </SubwayStop>
                                </p>
                            </>
                        )
                )}
            </div>
            <div class="ChatApp_content">
                <ContentSwitcher
                    value={appState.type}
                    args={{ peer, appState }}
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
            <div class="ChatApp_footer">
                {calc(
                    () =>
                        !appState.isPaired.get() && (
                            <>
                                <details>
                                    <summary>How does this work?</summary>
                                    <p>
                                        To use the internet, your computer is
                                        connected (possibly via WiFi or a
                                        cellular signal) to a series of routers.
                                    </p>
                                    <p>
                                        Each router has an IP address, which is
                                        a bit like a postal address. But many
                                        computers may be behind the same IP
                                        address, like how many people may live
                                        at the same postal address.
                                    </p>
                                    <p>
                                        For your friend's computer to talk
                                        directly to your computer, you need to
                                        let them know how to contact your
                                        computer—and they need to let you know
                                        how to contact their computer. This is
                                        why two messages need to be sent: an
                                        invitation and an acceptance.
                                    </p>
                                    <p>
                                        The way to contact your computer depends
                                        on how your router works. There are a
                                        few options:
                                    </p>
                                    <ul>
                                        <li>
                                            "Open Internet" - someone with your
                                            IP address can connect to your
                                            computer at any port number
                                        </li>
                                        <li>
                                            "Endpoint-independent" - someone
                                            with your IP address can connect to
                                            your computer at a certain port
                                            number you've created
                                        </li>
                                        <li>
                                            "Endpoint-dependent" - someone with
                                            your IP address can connect to your
                                            computer only after you have
                                            connected to them
                                        </li>
                                    </ul>
                                    <p>
                                        If either you or your friend have an
                                        "Open Internet" or
                                        "Endpoint-independent" network, then
                                        connecting directly is easy. But if you
                                        both have an "Endpoint-dependent"
                                        network, connecting directly is not
                                        possible.
                                    </p>
                                </details>
                            </>
                        )
                )}
                <pre>
                    Peer.connectionState:{peer.connectionState};
                    Peer.iceConnectionState:{peer.iceConnectionState};
                    Peer.signalingState:{peer.signalingState}
                    Peer.channel.readyState:
                    {calc(
                        () =>
                            peer.channel.get()?.readyState.get() ?? 'no channel'
                    )}
                </pre>
            </div>
        </div>
    );
};
