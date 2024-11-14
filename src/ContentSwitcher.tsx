import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

export function ContentSwitcher<
    TValue extends string | number | symbol,
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    TArgs extends {},
>({
    value,
    args,
    content,
}: {
    value: Dyn<TValue>;
    args: TArgs;
    content: Record<TValue, Component<TArgs>>;
}) {
    return (
        <>
            {calc(() => {
                const Component = content[dynGet(value)];
                return <Component {...args} />;
            })}
        </>
    );
}
