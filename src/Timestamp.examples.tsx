import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { Example } from './Example';
import { Timestamp } from './Timestamp';

import './Main.css';

const rerender = field({});
mount(
    document.body,
    <>
        {calc(() => {
            rerender.get();
            return (
                <>
                    <Example title="now">
                        On (<Timestamp time={Date.now()} />) something happened
                    </Example>
                    <Example title="5min ago">
                        On (<Timestamp time={Date.now() - 5 * 60 * 1000} />)
                        something happened
                    </Example>
                    <Example title="2 days ago">
                        On (
                        <Timestamp
                            time={Date.now() - 2 * 24 * 60 * 60 * 1000}
                        />
                        ) something happened
                    </Example>
                    <button on:click={() => rerender.set({})}>Rerender</button>
                </>
            );
        })}
    </>
);
