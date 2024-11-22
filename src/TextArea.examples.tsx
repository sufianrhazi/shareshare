import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Example } from './Example';
import { TextArea } from './TextArea';

import './ChatMain.scss';

const text = field<string>('initial text');
const disabled = field(false);
const readonly = field(false);
const minLines = field<number | undefined>(undefined);
const maxLines = field<number | undefined>(undefined);

mount(
    document.body,
    <>
        <Example contentStyle="padding: 20px" title="Controls">
            <Button on:click={() => text.set('initial text')}>
                Reset text
            </Button>
            <p>
                <Checkbox
                    checked={disabled}
                    on:input={(e, el) => disabled.set(el.checked)}
                >
                    disabled
                </Checkbox>
            </p>
            <p>
                <Checkbox
                    checked={readonly}
                    on:input={(e, el) => readonly.set(el.checked)}
                >
                    readonly
                </Checkbox>
            </p>
            <p>
                <label>
                    minLines:{' '}
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={calc(() => minLines.get())}
                        on:input={(e, el) =>
                            minLines.set(
                                isFinite(el.valueAsNumber)
                                    ? el.valueAsNumber
                                    : undefined
                            )
                        }
                    />
                </label>
            </p>
            <p>
                <label>
                    maxLines:{' '}
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={calc(() => maxLines.get())}
                        on:input={(e, el) =>
                            maxLines.set(
                                isFinite(el.valueAsNumber)
                                    ? el.valueAsNumber
                                    : undefined
                            )
                        }
                    />
                </label>
            </p>
        </Example>
        <Example contentStyle="padding: 20px" title="TextArea">
            <p>Content before</p>
            <TextArea
                value={text}
                onInput={(newText) => text.set(newText)}
                disabled={disabled}
                readonly={readonly}
                minLines={minLines}
                maxLines={maxLines}
            >
                Enter some text
            </TextArea>
            <p>Content after</p>
        </Example>
        <Example contentStyle="padding: 20px" title="Data">
            <p>Entered text:</p>
            <pre>{text}</pre>
        </Example>
    </>
);
