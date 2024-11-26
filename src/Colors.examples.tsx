import Gooey, {
    ArrayEventType,
    calc,
    collection,
    field,
    mount,
} from '@srhazi/gooey';
import type { Field } from '@srhazi/gooey';

import { Button } from './Button';
import { Example } from './Example';
import { Modal } from './Modal';
import { isArray, isEither, isExact, isShape, isString } from './shape';
import { _testReset } from './svc.reset';

import './ChatMain.scss';

_testReset();

const COLORS = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
] as const;
type Color = (typeof COLORS)[number];
const LIGHTNESS = ['light', 'dark'] as const;
type Lightness = (typeof LIGHTNESS)[number];
const DEGREES = ['0', '1', '2', '3', '4'] as const;
type Degree = (typeof DEGREES)[number];

const invert = (value: Lightness) => (value === 'light' ? 'light' : 'dark');

const selectedColor = field<Color>(COLORS[0]);
const selectedDegree = field<Degree>(DEGREES[0]);

const isColor = isEither(...COLORS.map((color) => isExact(color)));
const isLightness = isEither(...LIGHTNESS.map((light) => isExact(light)));
const isDegree = isEither(...DEGREES.map((degree) => isExact(degree)));
const isCollected = isShape({
    label: isString,
    colorFg: isColor,
    lightFg: isLightness,
    degreeFg: isDegree,
    colorBg: isColor,
    lightBg: isLightness,
    degreeBg: isDegree,
});

const collected = collection<CollectedItem>([]);

function load(str: null | string) {
    try {
        const parsed: unknown = str && JSON.parse(str);
        if (parsed && isArray(isCollected)(parsed)) {
            const newItems = parsed.map(
                ({
                    label,
                    colorFg,
                    lightFg,
                    degreeFg,
                    colorBg,
                    lightBg,
                    degreeBg,
                }) => ({
                    label: field(label),
                    colorFg: field(colorFg),
                    lightFg: field(lightFg),
                    degreeFg: field(degreeFg),
                    colorBg: field(colorBg),
                    lightBg: field(lightBg),
                    degreeBg: field(degreeBg),
                })
            );
            collected.splice(0, collected.length, ...newItems);
        }
    } catch (e) {
        console.error('Unable to load', e);
    }
}
try {
    const tmp = localStorage.getItem('Colors.examples');
    load(tmp);
} catch (e) {
    console.log('Ignoring localStorage error', e);
}

function serialize() {
    return collected.map(
        ({
            label,
            colorFg,
            lightFg,
            degreeFg,
            colorBg,
            lightBg,
            degreeBg,
        }) => ({
            label: label.get(),
            colorFg: colorFg.get(),
            lightFg: lightFg.get(),
            degreeFg: degreeFg.get(),
            colorBg: colorBg.get(),
            lightBg: lightBg.get(),
            degreeBg: degreeBg.get(),
        })
    );
}
function save() {
    console.log('Saving...');
    const serialized = serialize();
    localStorage.setItem('Colors.examples', JSON.stringify(serialized));
}

type CollectedItem = {
    label: Field<string>;
    colorFg: Field<Color>;
    lightFg: Field<Lightness>;
    degreeFg: Field<Degree>;
    colorBg: Field<Color>;
    lightBg: Field<Lightness>;
    degreeBg: Field<Degree>;
};
collected.subscribe((events) => {
    for (const event of events) {
        if (event.type === ArrayEventType.SPLICE && event.items) {
            event.items.forEach((item) => {
                item.label.subscribe(save);
                item.colorFg.subscribe(save);
                item.lightFg.subscribe(save);
                item.degreeFg.subscribe(save);
                item.colorBg.subscribe(save);
                item.lightBg.subscribe(save);
                item.degreeBg.subscribe(save);
            });
        }
    }
    save();
});

const editing = field<CollectedItem | undefined>(undefined);
const loading = field(false);

mount(
    document.body,
    <>
        <Example title="Picked">
            <Button on:click={() => loading.set(true)}>Load</Button>
            <Modal
                title="Load"
                open={loading}
                onClose={() => loading.set(false)}
                onSave={(formData) => {
                    const serialized = formData.get('serialized');
                    if (isString(serialized)) {
                        load(serialized);
                    }
                }}
            >
                <label>
                    Data: <input type="text" name="serialized" />
                </label>
            </Modal>
            <div
                style:display="grid"
                style:grid-template-columns="auto 1fr auto auto auto auto auto auto auto"
                style:align-items="center"
                style:gap="8px"
            >
                {collected.mapView((item) => (
                    <div style="display: contents; background-color: var(--color-warning-bg); color: var(--color-warning-fg);">
                        <label style="display: contents">
                            {calc(() =>
                                editing.get() === item ? (
                                    <b>Edit</b>
                                ) : (
                                    <span>Name</span>
                                )
                            )}
                            <input
                                type="text"
                                value={item.label}
                                on:input={(e, el) => item.label.set(el.value)}
                            />
                        </label>
                        <pre
                            on:click={() => {
                                selectedColor.set(item.colorFg.get());
                                selectedDegree.set(item.degreeFg.get());
                            }}
                            style:cursor="pointer"
                            style:font-size="10px"
                            style:display="inline-block"
                            style:padding="10px 20px"
                            style:color={calc(
                                () =>
                                    `var(--color-${item.lightFg.get()}-${item.colorFg.get()}-${item.degreeFg.get()})`
                            )}
                            style:background-color={calc(
                                () =>
                                    `var(--color-${item.lightBg.get()}-${item.colorBg.get()}-${item.degreeBg.get()})`
                            )}
                            style:border={calc(
                                () =>
                                    `thin ${item.lightBg.get() === 'dark' ? 'white' : 'black'} solid`
                            )}
                        >
                            --color-{item.label}
                        </pre>
                        <pre
                            on:click={() => {
                                selectedColor.set(item.colorBg.get());
                                selectedDegree.set(item.degreeBg.get());
                            }}
                            style:cursor="pointer"
                            style:font-size="10px"
                            style:display="inline-block"
                            style:padding="10px 20px"
                            style:background-color={calc(
                                () =>
                                    `var(--color-${item.lightFg.get()}-${item.colorFg.get()}-${item.degreeFg.get()})`
                            )}
                            style:color={calc(
                                () =>
                                    `var(--color-${item.lightBg.get()}-${item.colorBg.get()}-${item.degreeBg.get()})`
                            )}
                            style:border={calc(
                                () =>
                                    `thin ${item.lightBg.get() === 'light' ? 'white' : 'black'} solid`
                            )}
                        >
                            --color-{item.label}-inv
                        </pre>
                        <Button
                            primary
                            on:click={() =>
                                collected.reject((other) => item === other)
                            }
                        >
                            Del
                        </Button>
                        <Button
                            on:click={() => {
                                if (editing.get() === item) {
                                    editing.set(undefined);
                                } else {
                                    editing.set(item);
                                }
                            }}
                        >
                            {calc(() =>
                                editing.get() === item ? 'Done' : 'Edit'
                            )}
                        </Button>
                        <Button
                            on:click={() => {
                                const colorBg = item.colorBg.get();
                                const lightBg = item.lightBg.get();
                                const degreeBg = item.degreeBg.get();
                                const colorFg = item.colorFg.get();
                                const lightFg = item.lightFg.get();
                                const degreeFg = item.degreeFg.get();
                                item.colorBg.set(colorFg);
                                item.lightBg.set(lightFg);
                                item.degreeBg.set(degreeFg);
                                item.colorFg.set(colorBg);
                                item.lightFg.set(lightBg);
                                item.degreeFg.set(degreeBg);
                            }}
                        >
                            BG↔FG
                        </Button>
                        <Button
                            on:click={() => {
                                const index = collected.indexOf(item);
                                if (index > 0) {
                                    collected.moveSlice(index, 1, index - 1);
                                }
                            }}
                        >
                            ↑
                        </Button>
                        <Button
                            on:click={() => {
                                const index = collected.indexOf(item);
                                if (index < collected.length - 1) {
                                    collected.moveSlice(index, 1, index + 1);
                                }
                            }}
                        >
                            ↓
                        </Button>
                    </div>
                ))}
            </div>
            <details>
                <summary>Code</summary>
                <pre>
                    {calc(() => {
                        const lines = collected.flatMap((item) => {
                            return [
                                `--color-${item.label.get()}-fg: var(--color-${item.lightFg.get()}-${item.colorFg.get()}-${item.degreeFg.get()});`,
                                `--color-${item.label.get()}-bg: var(--color-${item.lightBg.get()}-${item.colorBg.get()}-${item.degreeBg.get()});`,
                                `--color-${item.label.get()}-fg-inv: var(--color-${invert(item.lightFg.get())}-${item.colorFg.get()}-${item.degreeFg.get()});`,
                                `--color-${item.label.get()}-bg-inv: var(--color-${invert(item.lightBg.get())}-${item.colorBg.get()}-${item.degreeBg.get()});`,
                                `--color-${item.label.get()}-fg-parts: var(--color-${item.lightFg.get()}-${item.colorFg.get()}-${item.degreeFg.get()}-parts);`,
                                `--color-${item.label.get()}-bg-parts: var(--color-${item.lightBg.get()}-${item.colorBg.get()}-${item.degreeBg.get()}-parts);`,
                                `--color-${item.label.get()}-fg-inv-parts: var(--color-${invert(item.lightFg.get())}-${item.colorFg.get()}-${item.degreeFg.get()}-parts);`,
                                `--color-${item.label.get()}-bg-inv-parts: var(--color-${invert(item.lightBg.get())}-${item.colorBg.get()}-${item.degreeBg.get()}-parts);`,
                            ];
                        });
                        lines.push(`/* ${JSON.stringify(serialize())} */`);
                        return lines.join('\n');
                    })}
                </pre>
            </details>
        </Example>
        <Example
            contentStyle="display: grid; grid-template-columns: auto auto auto auto auto; gap: 12px;"
            title="Colors"
        >
            <fieldset style:grid-column="span 5">
                <legend>Color</legend>
                <div
                    style:display="flex"
                    style:flex-direction="column"
                    style:gap="20px"
                >
                    <div
                        style:display="flex"
                        style:flex-direction="row"
                        style:gap="4px"
                    >
                        <b>Color</b>
                        {COLORS.map((color) => (
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        name="color"
                                        value={color}
                                        checked={calc(() => {
                                            const edit = editing.get();
                                            if (edit) {
                                                return (
                                                    edit.colorFg.get() === color
                                                );
                                            } else {
                                                return (
                                                    selectedColor.get() ===
                                                    color
                                                );
                                            }
                                        })}
                                        on:input={(e, el) => {
                                            if (el.checked) {
                                                const edit = editing.get();
                                                if (edit) {
                                                    edit.colorFg.set(color);
                                                } else {
                                                    selectedColor.set(color);
                                                }
                                            }
                                        }}
                                    />{' '}
                                    {color}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div
                        style:display="flex"
                        style:flex-direction="row"
                        style:gap="4px"
                    >
                        <b>Degree</b>
                        {DEGREES.map((degree) => (
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        name="degree"
                                        value={degree}
                                        checked={calc(() => {
                                            const edit = editing.get();
                                            if (edit) {
                                                return (
                                                    edit.degreeFg.get() ===
                                                    degree
                                                );
                                            } else {
                                                return (
                                                    selectedDegree.get() ===
                                                    degree
                                                );
                                            }
                                        })}
                                        on:input={(e, el) => {
                                            if (el.checked) {
                                                const edit = editing.get();
                                                if (edit) {
                                                    edit.degreeFg.set(degree);
                                                } else {
                                                    selectedDegree.set(degree);
                                                }
                                            }
                                        }}
                                    />{' '}
                                    {degree}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </fieldset>
            {LIGHTNESS.flatMap((lightBg) =>
                COLORS.flatMap((colorBg) =>
                    DEGREES.flatMap((degreeBg) => (
                        <div
                            on:click={() =>
                                collected.push({
                                    label: field('newcolor'),
                                    lightBg: field(lightBg),
                                    colorBg: field(colorBg),
                                    degreeBg: field(degreeBg),
                                    lightFg: field(
                                        lightBg === 'dark' ? 'light' : 'dark'
                                    ),
                                    colorFg: field(selectedColor.get()),
                                    degreeFg: field(selectedDegree.get()),
                                })
                            }
                            style:font-size="12px"
                            style:cursor="pointer"
                            style:padding="20px"
                            style:display="flex"
                            style:flex-direction="column"
                            style:align-items="center"
                            style:justify-content="center"
                            style:background-color={`var(--color-${lightBg}-${colorBg}-${degreeBg})`}
                            style:color={calc(
                                () =>
                                    `var(--color-${lightBg === 'dark' ? 'light' : 'dark'}-${selectedColor.get()}-${selectedDegree.get()})`
                            )}
                        >
                            <pre>
                                bg:
                                {`${lightBg}-${colorBg}-${degreeBg}`}
                            </pre>
                            <pre>
                                {calc(() => (
                                    <>
                                        fg:
                                        {`${lightBg === 'dark' ? 'light' : 'dark'}-${selectedColor.get()}-${selectedDegree.get()}`}
                                    </>
                                ))}
                            </pre>
                        </div>
                    ))
                )
            )}
        </Example>
    </>
);
