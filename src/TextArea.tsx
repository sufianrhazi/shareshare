import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { classes } from './classes';
import { clamp } from './numberUtils';

import './TextArea.css';

let maxId = 0;

export const TextArea: Component<
    {
        class?: Dyn<string | undefined>;
        labelClass?: Dyn<string | undefined>;
        textareaClass?: Dyn<string | undefined>;
        children?: JSX.Node | JSX.Node[];
        value: Dyn<string | undefined>;
        onInput?: undefined | ((newValue: string) => void);
        minLines?: Dyn<number | undefined>;
        maxLines?: Dyn<number | undefined>;
    } & Omit<JSX.IntrinsicElements['textarea'], 'rows' | 'cols'>
> = ({
    class: className,
    labelClass,
    textareaClass,
    value,
    onInput,
    minLines,
    maxLines,
    children,
    ...textareaProps
}) => {
    const valueAsString = calc(() => dynGet(value) ?? '');
    const rows = calc(() => {
        const valueLines = valueAsString.get().split('\n').length;
        const min = dynGet(minLines) ?? 2;
        const max = dynGet(maxLines) ?? Infinity;
        return clamp(min, valueLines, max);
    });
    const id = `TextArea_${maxId++}`;
    return (
        <div class={classes(className, 'TextArea')}>
            <label class={classes('TextArea_label', labelClass)} for={id}>
                {children}
            </label>
            <textarea
                id={id}
                class={classes('TextArea_input', textareaClass)}
                {...textareaProps}
                rows={rows}
                on:focus={
                    textareaProps['on:focus'] ??
                    ((e, el) => {
                        if (dynGet(textareaProps.readonly)) {
                            el.select();
                        }
                    })
                }
                on:input={
                    textareaProps['on:input'] ??
                    ((e, el) => {
                        onInput?.(el.value);
                    })
                }
                // @ts-expect-error -- TODO: fix type bug in Gooey
                value={valueAsString}
            />
        </div>
    );
};
