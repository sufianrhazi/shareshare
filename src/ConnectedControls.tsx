import Gooey, { calc, ClassComponent, collection, field } from '@srhazi/gooey';
import type { Collection, Component, EmptyProps, Field } from '@srhazi/gooey';

import { Button } from './Button';
import { Timestamp } from './Timestamp';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedControls.css';

export const ConnectedControls: Component<{
    class: string;
    onRename: (name: string) => void;
    onSendMessage: (msg: string) => void;
    chatMessages: Collection<LocalMessage>;
}> = (
    { class: className, onRename, onSendMessage, chatMessages },
    { onMount }
) => {
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
        <div class={`${className} ConnectedControls`}>
            <input
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
                primary
                disabled={calc(() => !toSend.get())}
                on:click={send}
            >
                Send
            </Button>
        </div>
    );
};
