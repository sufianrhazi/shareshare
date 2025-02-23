import Gooey, { collection, field, mount } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { Example } from './Example';
import { _testReset } from './svc.reset';

import './ChatMain.scss';

_testReset();

const isConnected = field(true);
const events = collection(['events go here']);
mount(
    document.body,
    <>
        <Example title="Controls">
            <ConnectedControls
                isConnected={isConnected}
                onRename={(newName) => {
                    events.push(`rename: ${newName}`);
                }}
                onShareUserMedia={(mediaStream) => {
                    if (mediaStream) {
                        events.push(`Shared media: ${mediaStream.id}`);
                    } else {
                        events.push(`Stopped sharing media`);
                    }
                }}
                onSendMessage={(message) => {
                    events.push(`message: ${message}`);
                }}
            />
        </Example>
        <Example title="Events">
            <ul>
                {events.mapView((event) => (
                    <li>{event}</li>
                ))}
            </ul>
        </Example>
    </>
);
