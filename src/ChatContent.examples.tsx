import Gooey, { calc, mount } from '@srhazi/gooey';

import { ChatContent } from './ChatContent';
import { Example } from './Example';
import { Peer } from './Peer';
import { StateMachine } from './StateMachine';
import type { StateMachineState } from './StateMachine';

import './ChatMain.scss';

const peer = new Peer(() => {
    throw new Error('nope');
});
const appState = new StateMachine();

const allStates: { label: string; state: StateMachineState }[] = [
    {
        label: 'start_host',
        state: {
            type: 'start_host',
        },
    },
    {
        label: 'invite_creating',
        state: {
            type: 'invite_creating',
        },
    },
    {
        label: 'invite_created (not copied)',
        state: {
            type: 'invite_created',
            inviteMessage: 'inviteMessage',
            copied: false,
        },
    },
    {
        label: 'invite_created (copied)',
        state: {
            type: 'invite_created',
            inviteMessage: 'inviteMessage',
            copied: true,
        },
    },
    {
        label: 'start_guest',
        state: {
            type: 'start_guest',
            inviteMessage: 'inviteMessage',
        },
    },
    {
        label: 'error',
        state: {
            type: 'error',
            reason: '<human readable reason>',
        },
    },
    {
        label: 'invite_accepted',
        state: {
            type: 'invite_accepted',
            inviteMessage: 'inviteMessage',
        },
    },
    {
        label: 'invite_rejected',
        state: {
            type: 'invite_rejected',
            inviteMessage: 'inviteMessage',
        },
    },
    {
        label: 'response_accepted',
        state: {
            type: 'response_accepted',
            inviteMessage: 'inviteMessage',
            responseMessage: 'responseMessage',
        },
    },
    {
        label: 'response_created (not copied)',
        state: {
            type: 'response_created',
            inviteMessage: 'inviteMessage',
            responseMessage: 'responseMessage',
            copied: false,
        },
    },
    {
        label: 'response_created (copied)',
        state: {
            type: 'response_created',
            inviteMessage: 'inviteMessage',
            responseMessage: 'responseMessage',
            copied: true,
        },
    },
    {
        label: 'connected',
        state: {
            type: 'connected',
        },
    },
];
appState._testSetState(allStates[0].state);
mount(
    document.body,
    <>
        <Example title="Controls">
            {allStates.map((targetState) => (
                <div>
                    <label>
                        <input
                            type="radio"
                            name="state"
                            checked={calc(
                                () => appState.getState() === targetState.state
                            )}
                            on:click={(e, el) => {
                                if (el.checked) {
                                    appState._testSetState(targetState.state);
                                }
                            }}
                        />{' '}
                        {targetState.label}
                    </label>
                </div>
            ))}
        </Example>
        <Example title="ChatContent">
            <ChatContent peer={peer} appState={appState} />
        </Example>
    </>
);
