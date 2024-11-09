import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { classes } from './classes';

import './Timestamp.css';

const nowMinutes = field(Date.now());
setInterval(() => {
    nowMinutes.set(Date.now());
}, 60 * 1000);

const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
});

export const Timestamp: Component<{
    class?: string | undefined;
    inline?: boolean | undefined;
    time: number;
}> = ({ class: className, inline, time }) => {
    const when = new Date(time);
    const timeStr = `${when.getHours().toString().padStart(2, '0')}:${when.getMinutes().toString().padStart(2, '0')}`;
    const parts = formatter.formatToParts(when);
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const dateStr = `${weekday} ${month} ${when.getDate()}`;
    const isoStr = when.toISOString();
    return (
        <time
            class={classes(className, 'Timestamp', {
                'Timestamp-inline': inline,
            })}
            datetime={isoStr}
            title={when.toLocaleString()}
        >
            {calc(() => {
                // Every minute we check to see if a time is in the prior day
                const now = nowMinutes.get();
                const nowDate = new Date(now);
                if (nowDate.getDate() === when.getDate()) {
                    return <tt>{timeStr}</tt>;
                }
                return <tt>{dateStr}</tt>;
            })}
            <span class="Timestamp_copy">{isoStr}</span>
        </time>
    );
};
