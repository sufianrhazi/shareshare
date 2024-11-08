import Gooey, { mount } from '@srhazi/gooey';

import examples from './examples-manifest.json';
import testManifest from './test-manifest.json';

mount(
    document.body,
    <>
        <h1>Index</h1>
        <ul id="index">
            <li>
                <a
                    href={`/node_modules/@srhazi/gooey-test/dist/testrunner/testrunner.html#${testManifest
                        .map((item) => item.src)
                        .join(':')}`}
                >
                    Run Tests
                </a>
            </li>
            <li>
                <a href="/chat.html">Chat App</a>
            </li>
            <li>
                <a href="/accept.html">Accept App</a>
            </li>
            {examples.map((example) => (
                <li>
                    <a href={example.src}>{example.src}</a>
                </li>
            ))}
        </ul>
    </>
);
