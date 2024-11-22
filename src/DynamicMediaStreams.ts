import { collection } from '@srhazi/gooey';
import type { Collection } from '@srhazi/gooey';

import { DynamicMediaStream } from './DynamicMediaStream';
import type { DynamicMediaStreamProps } from './DynamicMediaStream';

export class DynamicMediaStreams implements Disposable {
    public dynamicStreams: Collection<DynamicMediaStream>;

    constructor() {
        this.dynamicStreams = collection([]);
    }

    addStream(props: DynamicMediaStreamProps) {
        console.log(
            'ADDING STREAM',
            props.mediaStream.id,
            props.isLocal ? 'local' : 'remote'
        );
        const existing = this.dynamicStreams.find(
            (dynamicStream) => dynamicStream.id === props.mediaStream.id
        );
        if (!existing) {
            this.dynamicStreams.push(new DynamicMediaStream(props));
        }
    }

    removeStream(stream: MediaStream) {
        console.log('REMOVING (unwrapped) STREAM', stream.id);
        const removed = this.dynamicStreams.reject(
            (dynamicStream) => dynamicStream.id === stream.id
        );
        for (const dynamicStream of removed) {
            console.log(
                'REMOVING STREAM',
                dynamicStream.id,
                dynamicStream.isLocal ? 'local' : 'remote'
            );
            dynamicStream.dispose();
        }
    }

    dispose() {
        for (const dynamicStream of this.dynamicStreams) {
            dynamicStream.dispose();
        }
        this.dynamicStreams.splice(0, this.dynamicStreams.length);
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}
