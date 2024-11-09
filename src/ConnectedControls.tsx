import Gooey, { calc, dynGet, field } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { classes } from './classes';
import { mkid } from './mkid';
import { Modal } from './Modal';

import './ConnectedControls.css';

const nextId = mkid('ConnectedControls');

export const ConnectedControls: Component<{
    class?: string | undefined;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    onRename: (name: string) => void;
    onSendMessage: (msg: string) => void;
}> = (
    { class: className, localName, peerName, onRename, onSendMessage },
    { onMount }
) => {
    const renameDialogOpen = field(false);
    const id = nextId();
    const toSend = field('');
    const send = () => {
        const msg = toSend.get();
        if (msg.startsWith('/name ') && msg.length > 6) {
            onRename(msg.slice(6));
        } else {
            onSendMessage(toSend.get());
        }
        toSend.set('');
    };
    return (
        <div class={classes(className, 'ConnectedControls')}>
            <input
                id={id}
                placeholder={calc(() => `Message ${dynGet(peerName)}`)}
                class="ConnectedControls_input"
                type="text"
                value={toSend}
                on:input={(e, el) => toSend.set(el.value)}
                on:keydown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        send();
                    }
                }}
            />
            <Button
                class="ConnectedControls_send"
                primary
                disabled={calc(() => !toSend.get())}
                on:click={send}
            >
                Send
            </Button>
            <Modal
                title="Change name"
                open={renameDialogOpen}
                onSave={(formData) => {
                    const displayName = formData.get('displayName');
                    if (typeof displayName === 'string') {
                        onRename(displayName);
                    }
                }}
            >
                <p>
                    <label>
                        Display name:{' '}
                        <input
                            name="displayName"
                            type="text"
                            required
                            value={localName}
                        />
                    </label>
                </p>
            </Modal>
            <Buttons class="ConnectedControls_toolbar">
                <Button on:click={() => renameDialogOpen.set(true)} size="sm">
                    Change name...
                </Button>
                <Button size="sm">Send file...</Button>
                <Button size="sm">Start video...</Button>
                <Button size="sm">Start audio...</Button>
                <Button size="sm">Share screen...</Button>
            </Buttons>
        </div>
    );
};
