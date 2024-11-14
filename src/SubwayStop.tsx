import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { CircleIcon } from './CircleIcon';
import type { CircleIconStatus, CircleIconType } from './CircleIcon';

import './SubwayStop.css';

export const SubwayStop: Component<{
    icon?: Dyn<CircleIconType | undefined>;
    letter?: Dyn<string | undefined>;
    children?: JSX.Node | JSX.Node[];
    status?: Dyn<CircleIconStatus | undefined>;
}> = ({ children, icon, letter, status }) => {
    return (
        <div class="SubwayStop">
            {calc(() => {
                const iconName = dynGet(icon) ?? 'check';
                return (
                    <CircleIcon
                        class="SubwayStop_icon"
                        type={iconName}
                        status={status}
                        letter={letter}
                    />
                );
            })}
            {children}
        </div>
    );
};
