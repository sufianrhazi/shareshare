import Gooey, { calc, dynGet, dynSubscribe } from '@srhazi/gooey';
import type { ComponentLifecycle, Dyn } from '@srhazi/gooey';

import { Button } from './Button';

import './Tabs.css';

let maxId = 0;

export function Tabs<T extends string | number>(
    {
        tabs,
        active,
        onTabClick,
    }: {
        tabs: { tab: T; label: string; content: () => JSX.Node }[];
        active: Dyn<T>;
        onTabClick?: (tab: T) => void;
    },
    { onMount }: ComponentLifecycle
) {
    const id = `Tab${maxId++}`;
    const refs: Partial<Record<T, HTMLButtonElement>> = {};
    onMount(() => {
        let isMounted = false;
        const unsubscribe = dynSubscribe(active, (err, activeTab) => {
            if (isMounted) {
                if (activeTab) {
                    refs[activeTab]?.focus();
                }
            }
        });
        isMounted = true;
        return unsubscribe;
    });
    return (
        <div id={id} class="Tabs">
            <div
                role="tablist"
                class="Tabs_tablist"
                on:keydown={(e) => {
                    switch (e.key) {
                        case 'ArrowLeft': {
                            const index = tabs.findIndex(
                                (tab) => tab.tab === dynGet(active)
                            );
                            if (index > 0) {
                                onTabClick?.(tabs[index - 1].tab);
                            }
                            break;
                        }
                        case 'ArrowRight': {
                            const index = tabs.findIndex(
                                (tab) => tab.tab === dynGet(active)
                            );
                            if (index < tabs.length - 1) {
                                onTabClick?.(tabs[index + 1].tab);
                            }
                            break;
                        }
                        case 'Home': {
                            onTabClick?.(tabs[0].tab);
                            break;
                        }
                        case 'End': {
                            onTabClick?.(tabs[tabs.length - 1].tab);
                            break;
                        }
                    }
                }}
            >
                {tabs.map(({ tab, label, content }) => (
                    <Button
                        role="tab"
                        ref={(el) => {
                            refs[tab] = el;
                        }}
                        class="Tabs_tab"
                        aria-selected={calc(() =>
                            dynGet(active) === tab ? 'true' : 'false'
                        )}
                        aria-controls={`${id}_${tab}_panel`}
                        id={`${id}_${tab}_button`}
                        tabindex={calc(() =>
                            dynGet(active) === tab ? '0' : '-1'
                        )}
                        on:click={() => onTabClick?.(tab)}
                    >
                        {label}
                    </Button>
                ))}
            </div>
            {tabs.map(({ tab, content }) => (
                <div
                    class="Tabs_panel"
                    id={`${id}_${tab}_panel`}
                    role="tabpanel"
                    tabindex={calc(() => (dynGet(active) === tab ? '0' : '-1'))}
                    aria-labelledby={`${id}_${tab}_button`}
                    hidden={calc(() => (dynGet(active) === tab ? false : true))}
                >
                    {content()}
                </div>
            ))}
        </div>
    );
}
