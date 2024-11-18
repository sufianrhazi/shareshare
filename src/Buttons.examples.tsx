import Gooey, { mount } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { Example } from './Example';

import './ChatMain.scss';

mount(
    document.body,
    <>
        <Example contentStyle="padding: 20px" title="Buttons">
            <p>Content before</p>
            <Buttons>
                <Button primary>Primary button</Button>
                <Button>Secondary button</Button>
                <Button primary disabled>
                    Primary, disabled button
                </Button>
                <Button disabled>Secondary, disabled button</Button>
            </Buttons>
            <p>Content mid</p>
            <Buttons connected>
                <Button primary>Primary button</Button>
                <Button>Secondary button</Button>
                <Button primary disabled>
                    Primary, disabled button
                </Button>
                <Button disabled>Secondary, disabled button</Button>
            </Buttons>
            <p>Content after</p>
        </Example>
    </>
);
