import { collection } from '@srhazi/gooey';
import type { Collection } from '@srhazi/gooey';

import { DynamicMediaStream } from './DynamicMediaStream';
import type { DynamicMediaStreamProps } from './DynamicMediaStream';

export class DynamicMediaStreams implements Disposable {
    public dynamicStreams: Collection<DynamicMediaStream>;
    private subscriptions: Set<() => void>;

    constructor() {
        this.dynamicStreams = collection([]);
        this.subscriptions = new Set();
    }

    addStream(props: DynamicMediaStreamProps) {
        const existing = this.dynamicStreams.find(
            (dynamicStream) => dynamicStream.id === props.mediaStream.id
        );
        if (!existing) {
            const dynamicMediaStream = new DynamicMediaStream(props);
            this.dynamicStreams.push(dynamicMediaStream);
            const subscription = dynamicMediaStream.hasTracks.subscribe(
                (err, hasTracks) => {
                    if (!err && !hasTracks) {
                        const removed = this.dynamicStreams.reject(
                            (ds) => dynamicMediaStream.id === ds.id
                        );
                        for (const dynamicStream of removed) {
                            dynamicStream.dispose();
                        }
                        subscription();
                        this.subscriptions.delete(subscription);
                    }
                }
            );
            this.subscriptions.add(subscription);
        }
    }

    removeStream(stream: MediaStream) {
        const removed = this.dynamicStreams.reject(
            (dynamicStream) => dynamicStream.id === stream.id
        );
        for (const dynamicStream of removed) {
            dynamicStream.dispose();
        }
    }

    dispose() {
        for (const dynamicStream of this.dynamicStreams) {
            dynamicStream.dispose();
        }
        this.dynamicStreams.splice(0, this.dynamicStreams.length);
        for (const subscription of this.subscriptions) {
            subscription();
        }
        this.subscriptions.clear();
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}
