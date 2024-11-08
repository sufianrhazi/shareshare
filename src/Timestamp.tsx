import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import './Timestamp.css';

const nowMinutes = field(Date.now());
setInterval(() => {
    nowMinutes.set(Date.now());
}, 60 * 1000);

export const Timestamp: Component<{ time: number }> = ({ time }) => {
    const when = new Date(time);
    const timeStr = `${when.getHours().toString().padStart(2, '0')}:${when.getMinutes().toString().padStart(2, '0')}:${when.getSeconds().toString().padStart(2, '0')}`;
    return (
        <time
            class="Timestamp"
            datetime={when.toISOString()}
            title={when.toLocaleString()}
        >
            {calc(() => {
                // Every minute we check to see if a time is in the prior day
                const now = nowMinutes.get();
                const nowDate = new Date(now);
                if (nowDate.getDate() === when.getDate()) {
                    return <tt>{timeStr}</tt>;
                }
                return <tt>{when.toLocaleDateString()}</tt>;
            })}
        </time>
    );
};
