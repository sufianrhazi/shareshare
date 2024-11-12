import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { BroadcastManager } from './BroadcastManager';
import { Button } from './Button';
import { Buttons } from './Buttons';
import type { CircleIconStatus } from './CircleIcon';
import { ConnectedView } from './ConnectedView';
import { CopyButton } from './CopyButton';
import { LoadingIcon } from './LoadingIcon';
import { Peer } from './Peer';
import { SubwayStop } from './SubwayStop';
import { makePromise } from './utils';

import './ChatApp.css';

const makeInviteUrl = (msg: string) => {
    return `${window.location.origin}/chat.html#${msg}`;
};
const makeResponseUrl = (msg: string) => {
    return `${window.location.origin}/accept.html#${msg}`;
};

type StateMachineState =
    | { type: 'start_host' }
    | { type: 'invite_creating' }
    | { type: 'invite_created'; inviteMessage: string }
    | { type: 'invite_sent'; inviteMessage: string }
    | {
          type: 'response_accepted';
          inviteMessage: string;
          responseMessage: string;
      }
    | { type: 'connected' }
    | { type: 'error'; reason: string }
    | { type: 'start_guest'; inviteMessage: string }
    | { type: 'invite_accepted'; inviteMessage: string }
    | { type: 'invite_rejected'; inviteMessage: string }
    | {
          type: 'response_created';
          inviteMessage: string;
          responseMessage: string;
      }
    | { type: 'response_sent'; inviteMessage: string; responseMessage: string };

type StateMachineTransitions =
    | { event: 'create_invitation' }
    | { event: 'create_invitation_ok'; inviteMessage: string }
    | { event: 'create_invitation_failed' } // TODO: never occurs, but what if there aren't ICE candidates?
    | { event: 'copy_invitation' }
    | { event: 'receive_and_accept_response'; responseMessage: string }
    | { event: 'reject_response' }
    | { event: 'establish_connection' }
    | { event: 'establish_connection_failed' }
    | { event: 'accept_invitation' }
    | { event: 'reject_invitation' }
    | { event: 'create_response'; responseMessage: string }
    | { event: 'create_response_failed' }
    | { event: 'copy_response' };

function transition(
    state: StateMachineState,
    transition: StateMachineTransitions
): StateMachineState {
    switch (transition.event) {
        case 'create_invitation':
            if (state.type === 'start_host') {
                return { type: 'invite_creating' };
            }
            break;
        case 'create_invitation_ok':
            if (state.type === 'invite_creating') {
                return {
                    type: 'invite_created',
                    inviteMessage: transition.inviteMessage,
                };
            }
            break;
        case 'create_invitation_failed':
            if (state.type === 'invite_creating') {
                return {
                    type: 'error',
                    reason: 'Something went wrong when creating an invitation',
                };
            }
            break;
        case 'copy_invitation':
            if (
                state.type === 'invite_created' ||
                state.type === 'invite_sent'
            ) {
                return {
                    type: 'invite_sent',
                    inviteMessage: state.inviteMessage,
                };
            }
            break;
        case 'receive_and_accept_response':
            if (
                state.type === 'invite_created' ||
                state.type === 'invite_sent'
            ) {
                return {
                    type: 'response_accepted',
                    inviteMessage: state.inviteMessage,
                    responseMessage: transition.responseMessage,
                };
            }
            break;
        case 'reject_response':
            if (state.type === 'invite_sent') {
                return {
                    type: 'invite_sent',
                    inviteMessage: state.inviteMessage,
                };
            }
            break;
        case 'establish_connection':
            if (
                state.type === 'response_accepted' ||
                state.type === 'response_sent'
            ) {
                return {
                    type: 'connected',
                };
            }
            break;
        case 'establish_connection_failed':
            if (
                state.type === 'response_accepted' ||
                state.type === 'response_sent'
            ) {
                return {
                    type: 'error',
                    reason: 'A connection could not be established',
                };
            }
            break;
        case 'accept_invitation':
            if (state.type === 'start_guest') {
                return {
                    type: 'invite_accepted',
                    inviteMessage: state.inviteMessage,
                };
            }
            break;
        case 'reject_invitation':
            if (state.type === 'start_guest') {
                return {
                    type: 'invite_rejected',
                    inviteMessage: state.inviteMessage,
                };
            }
            break;
        case 'create_response':
            if (state.type === 'invite_accepted') {
                return {
                    type: 'response_created',
                    inviteMessage: state.inviteMessage,
                    responseMessage: transition.responseMessage,
                };
            }
            break;
        case 'create_response_failed':
            if (state.type === 'invite_accepted') {
                return {
                    type: 'error',
                    reason: 'Something went wrong when creating an invitation',
                };
            }
            break;
        case 'copy_response':
            if (
                state.type === 'response_created' ||
                state.type === 'response_sent'
            ) {
                return {
                    type: 'response_sent',
                    inviteMessage: state.inviteMessage,
                    responseMessage: state.responseMessage,
                };
            }
            break;
    }
    return {
        type: 'error',
        reason: `Unexpected state machine transition: ${JSON.stringify({
            state,
            transition,
        })}`,
    };
}

function getInitialState(): StateMachineState {
    let hash = location.hash;
    if (hash.startsWith('#')) {
        hash = hash.slice(1);
    }
    if (hash) {
        location.hash = '';
        return {
            type: 'start_guest',
            inviteMessage: hash,
        };
    }
    return { type: 'start_host' };
}

export const ChatApp: Component = () => {
    const appState = field<StateMachineState>(getInitialState());
    const isHost = calc(() => {
        return [
            'start_host',
            'invite_creating',
            'invite_created',
            'invite_sent',
            'response_accepted',
        ].includes(appState.get().type);
    });
    const isGuest = calc(() => {
        return [
            'start_guest',
            'invite_accepted',
            'invite_rejected',
            'response_created',
            'response_sent',
        ].includes(appState.get().type);
    });
    const isPaired = calc(() => {
        return ['connected'].includes(appState.get().type);
    });

    const broadcastManager = new BroadcastManager('chat');

    const stepCreate = calc((): { status: CircleIconStatus } => {
        const state = appState.get();
        switch (state.type) {
            case 'start_host':
                return { status: 'info' };
            case 'invite_creating':
                return { status: 'warn' };
            case 'invite_created':
            case 'invite_sent':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepInvite = calc((): { status: CircleIconStatus } => {
        const state = appState.get();
        switch (state.type) {
            case 'start_host':
            case 'invite_creating':
                return { status: 'info' };
            case 'invite_created':
                return { status: 'warn' };
            case 'invite_sent':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });

    const stepAccept = calc((): { status: CircleIconStatus } => {
        const state = appState.get();
        switch (state.type) {
            case 'start_guest':
                return { status: 'info' };
            case 'invite_accepted':
                return { status: 'warn' };
            case 'response_created':
            case 'response_sent':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepRespond = calc((): { status: CircleIconStatus } => {
        const state = appState.get();
        switch (state.type) {
            case 'start_guest':
            case 'invite_accepted':
                return { status: 'info' };
            case 'response_created':
                return { status: 'warn' };
            case 'response_sent':
            case 'connected':
                return { status: 'success' };
            case 'error':
            default:
                return { status: 'error' };
        }
    });
    const stepConnect = calc((): { status: CircleIconStatus } => {
        const state = appState.get();
        switch (state.type) {
            case 'start_host':
            case 'start_guest':
            case 'invite_accepted':
            case 'invite_rejected':
            case 'invite_creating':
            case 'invite_created':
            case 'invite_sent':
            case 'response_created':
                return { status: 'info' };
            case 'response_accepted':
            case 'response_sent':
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
        const state = appState.get();
        switch (state.type) {
            case 'invite_creating':
                appState.set(
                    transition(state, {
                        event: 'create_invitation_ok',
                        inviteMessage: toSend,
                    })
                );
                break;
            case 'invite_accepted':
                appState.set(
                    transition(state, {
                        event: 'create_response',
                        responseMessage: toSend,
                    })
                );
        }
        responsePromise = makePromise<string>();
        return responsePromise.promise;
    });
    peer.connected().then(() => {
        appState.set(
            transition(appState.get(), {
                event: 'establish_connection',
            })
        );
    });

    broadcastManager.onAccept(async (msg) => {
        appState.set(
            transition(appState.get(), {
                event: 'receive_and_accept_response',
                responseMessage: msg,
            })
        );
        responsePromise.resolve(msg);
    });

    return (
        <div class="ChatApp">
            <div class="ChatApp_title">
                <h1>Share Share</h1>
                {calc(
                    () =>
                        !isPaired.get() &&
                        isHost.get() && (
                            <div>
                                Share messages/files/media with a friend{' '}
                                <strong>directly</strong>.
                            </div>
                        )
                )}
                {calc(
                    () =>
                        !isPaired.get() &&
                        isGuest.get() && (
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
                        isGuest.get() && (
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
                        isHost.get() && (
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
                {calc(() => {
                    const state = appState.get();
                    switch (state.type) {
                        case 'error':
                            return (
                                <>
                                    <p>Uh oh, something went wrong!</p>
                                    <pre>{state.reason}</pre>
                                </>
                            );
                        case 'invite_created':
                        case 'invite_sent': {
                            const url = makeInviteUrl(state.inviteMessage);
                            return (
                                <p>
                                    <CopyButton
                                        data={url}
                                        onCopyDone={() => {
                                            appState.set(
                                                transition(state, {
                                                    event: 'copy_invitation',
                                                })
                                            );
                                        }}
                                    >
                                        Copy invitation
                                    </CopyButton>
                                    <input
                                        on:copy={() => {
                                            transition(state, {
                                                event: 'copy_invitation',
                                            });
                                        }}
                                        ref={(el) => {
                                            if (el) {
                                                el?.focus();
                                                el?.select();
                                            }
                                        }}
                                        type="text"
                                        readonly
                                        value={url}
                                    />
                                </p>
                            );
                        }
                        case 'invite_rejected':
                            return (
                                <p>
                                    I get it, someone sent you a weird link. No
                                    worries, have a nice day!
                                </p>
                            );
                        case 'response_accepted':
                            return (
                                <p>
                                    TODO: what to show when the response is
                                    accepted?
                                </p>
                            );
                        case 'start_guest':
                            return (
                                <>
                                    <p>
                                        <Buttons>
                                            <Button
                                                primary
                                                on:click={() => {
                                                    appState.set(
                                                        transition(state, {
                                                            event: 'accept_invitation',
                                                        })
                                                    );
                                                    peer.accept(
                                                        state.inviteMessage
                                                    ).then(() => {
                                                        console.log(
                                                            'WHEN DOES THIS HAPPEN?'
                                                        );
                                                    });
                                                }}
                                            >
                                                Accept your friend's invitation
                                            </Button>
                                            <Button
                                                on:click={() => {
                                                    appState.set(
                                                        transition(state, {
                                                            event: 'reject_invitation',
                                                        })
                                                    );
                                                }}
                                            >
                                                Reject this invitation
                                            </Button>
                                        </Buttons>
                                    </p>
                                    <p>
                                        Creating a <strong>direct</strong>{' '}
                                        connection between two computers
                                        requires finding out the kind of router
                                        configuration you have. This may take
                                        longer than you'd expect to do this,
                                        please be patient.
                                    </p>
                                </>
                            );
                        case 'start_host':
                            return (
                                <>
                                    <p>
                                        <Button
                                            primary
                                            on:click={() => {
                                                appState.set(
                                                    transition(state, {
                                                        event: 'create_invitation',
                                                    })
                                                );
                                                peer.start().catch(() => {
                                                    appState.set(
                                                        transition(
                                                            appState.get(),
                                                            {
                                                                event: 'create_invitation_failed',
                                                            }
                                                        )
                                                    );
                                                });
                                            }}
                                        >
                                            Create an invitation link
                                        </Button>
                                    </p>
                                    <p>
                                        Creating a <strong>direct</strong>{' '}
                                        connection between two computers
                                        requires finding out the kind of router
                                        configuration you have. This may take
                                        longer than you'd expect to do this,
                                        please be patient.
                                    </p>
                                </>
                            );
                        case 'invite_accepted':
                            return (
                                <>
                                    <p>
                                        <Button primary disabled>
                                            <LoadingIcon /> Generating response
                                            link...
                                        </Button>
                                    </p>
                                    <p>
                                        Creating a <strong>direct</strong>{' '}
                                        connection between two computers
                                        requires finding out the kind of router
                                        configuration you have. This may take
                                        longer than you'd expect to do this,
                                        please be patient.
                                    </p>
                                </>
                            );
                        case 'response_created': {
                            const url = makeResponseUrl(state.responseMessage);
                            return (
                                <>
                                    <p>
                                        <CopyButton
                                            primary
                                            data={url}
                                            onCopy={() => {
                                                appState.set(
                                                    transition(state, {
                                                        event: 'copy_response',
                                                    })
                                                );
                                            }}
                                        >
                                            Copy response link
                                        </CopyButton>
                                    </p>
                                    <p>
                                        This response link gives your friend
                                        information about how to contact your
                                        computer directly.
                                    </p>
                                </>
                            );
                        }
                        case 'response_sent':
                            {
                                const url = makeResponseUrl(
                                    state.responseMessage
                                );
                                return (
                                    <>
                                        <p>
                                            <CopyButton
                                                primary
                                                data={url}
                                                onCopy={() => {
                                                    appState.set(
                                                        transition(state, {
                                                            event: 'copy_response',
                                                        })
                                                    );
                                                }}
                                            >
                                                Copy response link
                                            </CopyButton>
                                        </p>
                                        <p>
                                            Send the response link to your
                                            friend so they can connect to
                                            computer directly.
                                        </p>
                                    </>
                                );
                            }
                            break;
                        case 'invite_creating':
                            return (
                                <>
                                    <p>
                                        <Button primary disabled>
                                            <LoadingIcon /> Generating link...
                                        </Button>
                                    </p>
                                    <p>
                                        Creating a <strong>direct</strong>{' '}
                                        connection between two computers
                                        requires finding out the kind of router
                                        configuration you have. This may take a
                                        few moments, please be patient.
                                    </p>
                                </>
                            );

                        case 'connected': {
                            return <ConnectedView peer={peer} />;
                        }
                    }
                })}
            </div>
            <div class="ChatApp_footer">
                {calc(
                    () =>
                        !isPaired.get() && (
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
            </div>
        </div>
    );
};
