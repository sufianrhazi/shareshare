import Gooey, { dynSet, dynSubscribe, ref } from '@srhazi/gooey';
import type { Component, Field } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';

import './Modal.css';

export const Modal: Component<{
    open: Field<boolean>;
    title: string;
    onSave?: (formData: FormData) => boolean | void;
    onCancel?: () => void;
    onClose?: () => void;
    children?: JSX.Node | JSX.Node[];
}> = ({ open, title, onSave, onClose, onCancel, children }, { onMount }) => {
    const dialogRef = ref<HTMLDialogElement>();
    onMount(() => {
        return dynSubscribe(open, (err, isOpen) => {
            if (isOpen) {
                dialogRef.current?.showModal();
            } else {
                dialogRef.current?.close();
            }
        });
    });
    return (
        <dialog
            class="Modal"
            ref={dialogRef}
            on:cancel={() => {
                onCancel?.();
                dynSet(open, false);
            }}
            on:close={() => {
                dynSet(open, false);
                onClose?.();
            }}
        >
            {title && <h3>{title}</h3>}
            <form
                method="dialog"
                on:submit={(e, el) => {
                    e.preventDefault();
                    if (!el.reportValidity()) {
                        return;
                    }
                    const formData = new FormData(el);
                    if (!onSave?.(formData)) {
                        dynSet(open, false);
                    }
                }}
            >
                {children}
                <Buttons class="Modal_buttons">
                    <Button primary type="submit">
                        Save
                    </Button>
                    <Button
                        on:click={(e) => {
                            e.preventDefault();
                            console.log('HI');
                            onCancel?.();
                            dynSet(open, false);
                        }}
                    >
                        Cancel
                    </Button>
                </Buttons>
            </form>
        </dialog>
    );
};
