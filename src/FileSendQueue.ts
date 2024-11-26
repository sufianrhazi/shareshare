import type { Collection, Field } from '@srhazi/gooey';
import { collection, field } from '@srhazi/gooey';

import { bytesToBase64 } from './base64';
import { svc } from './svc';
import { assert } from './utils';

interface FileSendQueueItem {
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
    size: number;
    sentOffset: Field<number>;
    ackOffset: Field<number>;
    readyState: Field<'queued' | 'sending' | 'sent' | 'received' | 'cancelled'>;
}

interface FileSendHandleEvent {
    readyState: 'queued' | 'sending' | 'sent' | 'received' | 'cancelled';
    sentOffset: number;
    ackOffset: number;
}

type FileSendHandleProgressHandler = (event: FileSendHandleEvent) => void;

// Using a chunk size of 8KB
const CHUNK_SIZE = 8 * 1024;

class FileSendHandle {
    public readyState: 'queued' | 'sending' | 'sent' | 'received' | 'cancelled';
    private onCancel: () => void;
    private listeners: Set<FileSendHandleProgressHandler>;
    private size: number;
    private sentOffset: number;
    private ackOffset: number;

    constructor(size: number, onCancel: () => void) {
        this.readyState = 'queued';
        this.listeners = new Set();
        this.onCancel = onCancel;
        this.size = size;
        this.sentOffset = 0;
        this.ackOffset = 0;
    }

    cancel() {
        assert(
            this.readyState !== 'received',
            'Invariant: cannot cancel received file'
        );
        this.readyState = 'cancelled';
        for (const listener of this.listeners) {
            listener({
                readyState: this.readyState,
                sentOffset: this.sentOffset,
                ackOffset: this.ackOffset,
            });
        }
        this.onCancel();
    }

    onSent(sentOffset: number) {
        assert(
            this.readyState === 'queued' || this.readyState === 'sending',
            'Invariant: bad state'
        );
        if (this.readyState === 'queued') {
            this.readyState = 'sending';
        }
        this.sentOffset = sentOffset;
        if (this.sentOffset === this.size) {
            this.readyState = 'sent';
        }
        for (const listener of this.listeners) {
            listener({
                readyState: this.readyState,
                sentOffset: this.sentOffset,
                ackOffset: this.ackOffset,
            });
        }
    }

    onAck(ackOffset: number) {
        assert(
            this.readyState === 'sending' || this.readyState === 'sent',
            'Invariant: bad state'
        );
        this.ackOffset = ackOffset;
        if (this.ackOffset === this.size) {
            this.readyState = 'received';
        }
        for (const listener of this.listeners) {
            listener({
                readyState: this.readyState,
                sentOffset: this.sentOffset,
                ackOffset: this.ackOffset,
            });
        }
    }

    addEventListener(name: 'progress', handler: FileSendHandleProgressHandler) {
        this.listeners.add(handler);
    }

    removeEventListener(
        name: 'progress',
        handler: FileSendHandleProgressHandler
    ) {
        this.listeners.delete(handler);
    }
}

// Responsibility:
// - Accept a queue of files
// - Upload them one by one to the peer in <16k messages
// - Recipients need to ack each message?
// - Chat messages need to have a placeholder for the sent/received files
export class FileSendQueue implements Disposable {
    public queue: Collection<FileSendQueueItem>;
    private connected: boolean;
    private connectionSubscription: () => void;

    constructor() {
        this.queue = collection([]);
        this.connected = false;
        this.connectionSubscription = svc('peer').connectionState.subscribe(
            (err, value) => {
                if (!err) {
                    const wasConnected = this.connected;
                    this.connected = value === 'connected';
                    if (!wasConnected && this.connected) {
                        this.pump();
                    }
                }
            }
        );
        svc('peer').onMessage(this.onPeerMessage);
    }

    dispose() {
        this.queue.reject(() => true);
        this.connectionSubscription();
    }

    [Symbol.dispose]() {
        this.dispose();
    }

    onPeerMessage = (message: string) => {};

    async sendFile({
        fileName,
        contentType,
        blob,
    }: {
        fileName: string;
        contentType: string;
        blob: Blob;
    }): Promise<FileSendHandle> {
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const size = bytes.length;
        const queueItem: FileSendQueueItem = {
            fileName,
            contentType,
            bytes,
            size,
            sentOffset: field(0),
            ackOffset: field(0),
            readyState: field('queued'),
        };
        const handle = new FileSendHandle(size, () => {
            this.queue.reject((item) => item === queueItem);
        });
        const onProgress = (event: FileSendHandleEvent) => {
            queueItem.readyState.set(event.readyState);
            queueItem.sentOffset.set(event.sentOffset);
            queueItem.ackOffset.set(event.ackOffset);
        };
        handle.addEventListener('progress', onProgress);
        this.queue.push(queueItem);
        return handle;
    }

    private pump() {
        if (this.queue.length === 0) {
            return;
        }
        const item = this.queue[0];
        switch (item.readyState.get()) {
            case 'queued':
            case 'sending': {
                const start = item.sentOffset.get();
                const end = start + CHUNK_SIZE;
                const chunk = item.bytes.slice(start, end);
                const message = bytesToBase64(chunk);
                break;
            }
            case 'sent':
                // Do nothing; we need to wait for the other side to acknowledge
                return;
            case 'received':
            case 'cancelled':
            default:
                assert(
                    false,
                    'FileSendQueue item invariant: pumped item in unexpected state',
                    item.readyState.get()
                );
                break;
        }
    }
}
