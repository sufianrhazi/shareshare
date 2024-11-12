import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { BroadcastManager } from './BroadcastManager';
import { Button } from './Button';
import { Buttons } from './Buttons';

import './ChatApp.css'; // Yes, this is wrong

export const AcceptApp: Component = () => {
    const broadcastManager = new BroadcastManager('accept');
    const accepted = field(false);
    const cancelled = field(false);
    let fragment = location.hash;
    if (fragment.startsWith('#')) {
        fragment = fragment.slice(1);
    }
    return (
        <div class="ChatApp">
            <div class="ChatApp_title">
                <h1>Share Share Accept</h1>
                <div>
                    A friend wants to share messages/files/media with you{' '}
                    <strong>directly</strong>.
                </div>
            </div>
            <div class="ChatApp_content">
                {calc(() => {
                    if (accepted.get()) {
                        return <p>Thanks, you can close this tab now.</p>;
                    }
                    if (cancelled.get()) {
                        return (
                            <p>
                                I get it, someone sent you a weird link. No
                                worries, have a nice day!
                            </p>
                        );
                    }
                    const chatTabs = broadcastManager.localTabs.filter(
                        (localTab) => localTab.role === 'chat'
                    );
                    if (chatTabs.length === 0) {
                        return (
                            <p>
                                But you closed that tab! It's okay, you just
                                need to{' '}
                                <a href={`${window.location.origin}/chat.html`}>
                                    start over
                                </a>
                                .
                            </p>
                        );
                    } else if (chatTabs.length === 1) {
                        return (
                            <Buttons>
                                <Button
                                    primary
                                    on:click={() => {
                                        broadcastManager.postMessage({
                                            toId: chatTabs[0].otherId,
                                            type: 'acceptMessage',
                                            message: fragment,
                                        });
                                        accepted.set(true);
                                    }}
                                >
                                    Acknowledge and start sharing
                                </Button>
                                <Button
                                    on:click={() => {
                                        cancelled.set(true);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Buttons>
                        );
                    } else if (chatTabs.length > 1) {
                        return (
                            <p>
                                It looks like you have multiple chat tabs open!
                                This application can only work with one open.
                                Please close all but one.
                            </p>
                        );
                    }
                })}
            </div>
        </div>
    );
};
