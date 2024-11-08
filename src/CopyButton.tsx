import Gooey, { calc, dynGet, field } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { Button } from './Button';

import './CopyButton.css';

export const CopyButton: Component<{
    data: Dyn<string>;
    primary?: Dyn<boolean | undefined>;
    onCopy?: (e: MouseEvent) => void;
    onCopyDone?: () => void;
    children?: JSX.Node | JSX.Node[];
}> = ({ data, primary, onCopy, onCopyDone, children }) => {
    const copied = field(false);
    return (
        <Button
            class="CopyButton"
            primary={primary}
            disabled={calc(() => copied.get())}
            on:click={async (e) => {
                await navigator.clipboard.writeText(dynGet(data));
                copied.set(true);
                setTimeout(() => {
                    copied.set(false);
                    onCopyDone?.();
                }, 3000);
                onCopy?.(e);
            }}
        >
            {calc(
                () =>
                    copied.get() && (
                        <span class="CopyButton__flash">Copied!</span>
                    )
            )}
            <span
                class={calc(() =>
                    copied.get()
                        ? 'CopyButton__children CopyButton__children--copied'
                        : 'CopyButton__children'
                )}
            >
                {children}
            </span>
        </Button>
    );
};
