import { calc, field } from '@srhazi/gooey';
import type { Field } from '@srhazi/gooey';

export type StateMachineState =
    | { type: 'start_host' }
    | { type: 'invite_creating' }
    | { type: 'invite_created'; inviteMessage: string; copied: boolean }
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
          copied: boolean;
      };

export type StateMachineTransitions =
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

export class StateMachine {
    private state: Field<StateMachineState>;
    public type = calc(() => this.state.get().type);

    constructor() {
        this.state = field(getInitialState());
    }

    _testSetState(state: StateMachineState) {
        this.state.set(state);
    }

    getType() {
        return this.type.get();
    }

    getState() {
        return this.state.get();
    }

    private transition(transition: StateMachineTransitions): StateMachineState {
        const state = this.state.get();
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
                        copied: false,
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
                if (state.type === 'invite_created') {
                    return {
                        type: 'invite_created',
                        inviteMessage: state.inviteMessage,
                        copied: true,
                    };
                }
                break;
            case 'receive_and_accept_response':
                if (state.type === 'invite_created') {
                    return {
                        type: 'response_accepted',
                        inviteMessage: state.inviteMessage,
                        responseMessage: transition.responseMessage,
                    };
                }
                break;
            case 'reject_response':
                if (state.type === 'invite_created') {
                    return state;
                }
                break;
            case 'establish_connection':
                return {
                    type: 'connected',
                };
                break;
            case 'establish_connection_failed':
                if (state.type === 'response_accepted') {
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
                        copied: false,
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
                if (state.type === 'response_created') {
                    return {
                        type: 'response_created',
                        inviteMessage: state.inviteMessage,
                        responseMessage: state.responseMessage,
                        copied: true,
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

    dispatch = (action: StateMachineTransitions) => {
        this.state.set(this.transition(action));
    };

    isHost = calc(() => {
        return [
            'start_host',
            'invite_creating',
            'invite_created',
            'invite_sent',
            'response_accepted',
        ].includes(this.getType());
    });

    isGuest = calc(() => {
        return [
            'start_guest',
            'invite_accepted',
            'invite_rejected',
            'response_created',
            'response_sent',
        ].includes(this.getType());
    });

    isPaired = calc(() => {
        return ['connected'].includes(this.getType());
    });
}
