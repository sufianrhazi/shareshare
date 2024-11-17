import Gooey, { field, mount } from '@srhazi/gooey';

import { Example } from './Example';
import { Tabs } from './Tabs';

import './ChatMain.scss';

type Tabs = 'one' | 'two' | 'three' | 'four' | 'five';
const active = field<Tabs>('one');

mount(
    document.body,
    <>
        <Example contentStyle="padding: 20px" title="Tabs">
            <p>Content before</p>
            <Tabs
                active={active}
                onTabClick={(newActive) => active.set(newActive)}
                tabs={[
                    {
                        tab: 'one',
                        label: 'Tab 1',
                        content: () => (
                            <div>
                                This is tab 1 <a href="#">focus me</a>
                            </div>
                        ),
                    },
                    {
                        tab: 'two',
                        label: 'Tab 2',
                        content: () => <div>This is tab 2</div>,
                    },
                    {
                        tab: 'three',
                        label: 'Tab 3',
                        content: () => <div>This is tab 3</div>,
                    },
                    {
                        tab: 'four',
                        label: 'Tab 4',
                        content: () => <div>This is tab 4</div>,
                    },
                ]}
            />
            <p>Content after</p>
        </Example>
    </>
);
