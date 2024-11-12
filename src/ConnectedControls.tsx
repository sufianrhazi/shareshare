import Gooey, { calc, dynGet, field } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { classes } from './classes';
import { MediaPicker } from './MediaPicker';
import { mkid } from './mkid';
import { Modal } from './Modal';

import './ConnectedControls.css';

const nextId = mkid('ConnectedControls');

export const ConnectedControls: Component<{
    class?: string | undefined;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    onRename: (name: string) => void;
    onShareUserMedia: (media: MediaStream | undefined) => void;
    onSendMessage: (msg: string) => void;
}> = (
    {
        class: className,
        localName,
        peerName,
        onShareUserMedia,
        onRename,
        onSendMessage,
    },
    { onMount }
) => {
    const renameDialogOpen = field(false);
    const shareDialogOpen = field(false);
    const sharedUserMedia = field<undefined | MediaStream>(undefined);
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
            <Modal
                title="Share"
                open={shareDialogOpen}
                onSave={(formData) => {
                    onShareUserMedia(sharedUserMedia.get());
                }}
                onCancel={() => {
                    onShareUserMedia(undefined);
                }}
            >
                {calc(
                    () =>
                        shareDialogOpen.get() && (
                            <MediaPicker
                                setUserMedia={(userMedia) => {
                                    sharedUserMedia.set(userMedia);
                                }}
                            />
                        )
                )}
            </Modal>
            <Buttons class="ConnectedControls_toolbar">
                <Button on:click={() => renameDialogOpen.set(true)} size="sm">
                    Change name...
                </Button>
                <Button on:click={() => shareDialogOpen.set(true)} size="sm">
                    Share...
                </Button>
                <Button
                    disabled={calc(() => !sharedUserMedia.get())}
                    on:click={() => {
                        sharedUserMedia.set(undefined);
                        onShareUserMedia(undefined);
                    }}
                    size="sm"
                >
                    Stop sharing
                </Button>
            </Buttons>
        </div>
    );
};
