import Gooey, { calc, dynGet } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import './CircleIcon.css';

export type CircleIconStatus = 'success' | 'warn' | 'error' | 'info';

const InnerIcon = {
    ellipsis: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375"
        />
    ),
    check: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75 11.25 15 15 9.75"
        />
    ),
    plus: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v6m3-3H9"
        />
    ),
    minus: () => (
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9" />
    ),
    x: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5"
        />
    ),
    arrowDown: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5"
        />
    ),
    arrowLeft: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m11.25 9-3 3m0 0 3 3m-3-3h7.5"
        />
    ),
    arrowRight: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m12.75 15 3-3m0 0-3-3m3 3h-7.5"
        />
    ),
    arrowUp: () => (
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m15 11.25-3-3m0 0-3 3m3-3v7.5"
        />
    ),
} as const;

export type CircleIconType = keyof typeof InnerIcon;

export const CircleIcon: Component<{
    type?: Dyn<CircleIconType | undefined>;
    letter?: Dyn<string | undefined>;
    status?: Dyn<CircleIconStatus | undefined>;
}> = ({ type, letter, status }) => (
    <svg
        class={calc(() => `CircleIcon CircleIcon-${dynGet(status) || 'info'}`)}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
    >
        {calc(() => {
            const iconName = dynGet(type);
            let innerIcon: JSX.Node;
            if (dynGet(letter)) {
                innerIcon = (
                    <foreignObject x="0" y="0" width="24" height="24">
                        <span class="CircleIcon_letter">{letter}</span>
                    </foreignObject>
                );
            } else {
                innerIcon = iconName ? InnerIcon[iconName]() : undefined;
            }
            return (
                <>
                    <path
                        class="CircleIcon_circle"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                    {innerIcon}
                </>
            );
        })}
    </svg>
);
