import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { CircleIcon } from './CircleIcon';
import type { CircleIconStatus, CircleIconType } from './CircleIcon';

import './Checkbox.css';

let maxId = 0;
export const Checkbox: Component<
    {
        block?: boolean;
        icon?: Dyn<CircleIconType | undefined>;
        letter?: Dyn<string | undefined>;
        children?: JSX.Node | JSX.Node[];
        status?: Dyn<CircleIconStatus | undefined>;
    } & Omit<JSX.IntrinsicElements['input'], 'id' | 'hidden' | 'children'>
> = ({
    block,
    checked,
    children,
    class: className,
    icon,
    indeterminate,
    letter,
    status,
    type = 'checkbox',
    ...inputProps
}) => {
    const id = `Checkbox${maxId++}`;

    return (
        <div
            class={calc(
                () =>
                    `Checkbox ${block ? 'Checkbox-block' : ''} ${dynGet(className)} Checkbox-${dynGet(status) || 'info'}`
            )}
        >
            <label class="Checkbox_label" for={id}>
                {calc(() => {
                    let contents = undefined;
                    if (dynGet(indeterminate)) {
                        return <CircleIcon type="ellipsis" status={status} />;
                    }
                    if (dynGet(checked)) {
                        let iconName = dynGet(icon) ?? 'check';
                        return (
                            <CircleIcon
                                type={iconName}
                                status={status}
                                letter={letter}
                            />
                        );
                    }
                    return <CircleIcon status={status} />;
                })}
                {children}
            </label>
            <input
                class="Checkbox_input"
                checked={checked}
                indeterminate={indeterminate}
                id={id}
                type={type}
                hidden
                {...inputProps}
            />
        </div>
    );
};
<svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="size-6"
></svg>;
