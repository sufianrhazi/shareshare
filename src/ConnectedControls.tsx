import Gooey, { calc, dynGet, field } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { classes } from './classes';
import { Icon } from './Icon';
import { MediaPicker } from './MediaPicker';
import { mkid } from './mkid';
import { Modal } from './Modal';

import './ConnectedControls.css';

const nextId = mkid('ConnectedControls');

export const ConnectedControls: Component<{
    class?: string | undefined;
    isConnected: Dyn<boolean>;
    localName: Dyn<string>;
    peerName: Dyn<string>;
    onRename: (name: string) => void;
    onShareUserMedia: (media: MediaStream | undefined) => void;
    onSendMessage: (msg: string) => void;
}> = (
    {
        class: className,
        isConnected,
        localName,
        peerName,
        onShareUserMedia,
        onRename,
        onSendMessage,
    },
    { onMount }
) => {
    const showToolbar = field(false);
    const renameDialogOpen = field(false);
    const shareDialogOpen = field(false);
    const sharedUserMedia = field<undefined | MediaStream>(undefined);
    const id = nextId();
    const toSend = field('');
    const send = () => {
        const msg = toSend.get();
        if (msg.startsWith('/name ') && msg.length > 6) {
            onRename(msg.slice(6));
        } else if (msg) {
            onSendMessage(toSend.get());
        }
        toSend.set('');
    };
    return (
        <div class={classes(className, 'ConnectedControls')}>
            {calc(
                () =>
                    showToolbar.get() && (
                        <Buttons class="ConnectedControls_toolbar">
                            <Button
                                on:click={() => renameDialogOpen.set(true)}
                                size="sm"
                            >
                                Change name...
                            </Button>
                            <Button
                                on:click={() => shareDialogOpen.set(true)}
                                size="sm"
                            >
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
                    )
            )}
            <form
                class="ConnectedControls_form"
                on:submit={(e, el) => {
                    e.preventDefault();
                    send();
                }}
            >
                <input
                    id={id}
                    disabled={calc(() => !dynGet(isConnected))}
                    placeholder={calc(() => `Message ${dynGet(peerName)}`)}
                    class="ConnectedControls_input"
                    name="toSend"
                    type="text"
                    value={toSend}
                    on:input={(e, el) => toSend.set(el.value)}
                />
                <Button
                    class="ConnectedControls_send"
                    type="submit"
                    primary
                    disabled={calc(() => !dynGet(isConnected) || !toSend.get())}
                >
                    Send
                </Button>
                <Button
                    class="ConnectedControls_extra"
                    type="button"
                    disabled={calc(() => !dynGet(isConnected))}
                    on:click={() => shareDialogOpen.set(true)}
                >
                    {calc(() =>
                        showToolbar.get() ? (
                            <Icon type="minus" />
                        ) : (
                            <Icon type="plus" />
                        )
                    )}
                </Button>
            </form>
            <Modal
                title="Change name"
                open={renameDialogOpen}
                onClose={() => renameDialogOpen.set(false)}
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
                onClose={() => shareDialogOpen.set(false)}
                onSave={(formData) => {
                    onShareUserMedia(sharedUserMedia.get());
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
        </div>
    );
};
