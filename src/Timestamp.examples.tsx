import Gooey, { mount } from '@srhazi/gooey';

import { Example } from './Example';
import { Timestamp } from './Timestamp';

import './ChatMain.scss';

mount(
    document.body,
    <>
        {[false, true].map((inline) => (
            <>
                <Example title="now">
                    On (
                    <Timestamp inline={inline} time={Date.now()} />) something
                    happened
                </Example>
                <Example title="5min ago">
                    On (
                    <Timestamp
                        inline={inline}
                        time={Date.now() - 5 * 60 * 1000}
                    />
                    ) something happened
                </Example>
                <Example title="2 days ago">
                    On (
                    <Timestamp
                        inline={inline}
                        time={Date.now() - 2 * 24 * 60 * 60 * 1000}
                    />
                    ) something happened
                </Example>
                <Example title="15 days ago">
                    On (
                    <Timestamp
                        inline={inline}
                        time={Date.now() - 15 * 24 * 60 * 60 * 1000}
                    />
                    ) something happened
                </Example>
            </>
        ))}
    </>
);
