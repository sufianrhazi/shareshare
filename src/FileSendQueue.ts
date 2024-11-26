import type { Collection, Field } from '@srhazi/gooey';
import { collection, field } from '@srhazi/gooey';

import { bytesToBase64 } from './base64';
import type { PeerService } from './Peer';
import { isExact, isNumber, isShape, isString } from './shape';
import type { CheckType } from './shape';
import { assert } from './utils';

export const isFilePushMessage = isShape({
    type: isExact('file:chunk'),
    id: isString,
    size: isNumber,
    offset: isNumber,
    base64: isString,
});
export type FilePushMessage = CheckType<typeof isFilePushMessage>;
export function encodeFilePushMessage(msg: FilePushMessage) {
    return JSON.stringify(msg);
}

export const isFileAckMessage = isShape({
    type: isExact('file:ack'),
    id: isString,
    offset: isNumber,
});
export type FileAckMessage = CheckType<typeof isFileAckMessage>;
export function encodeFileAckMessage(msg: FileAckMessage) {
    return JSON.stringify(msg);
}

interface FileSendQueueItem {
    id: string;
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
    size: number;
    sentOffset: Field<number>;
    ackOffset: Field<number>;
    readyState: Field<
        'queued' | 'sending' | 'sent' | 'end:received' | 'end:cancelled'
    >;
}

interface FileSendHandleEvent {
    readyState:
        | 'queued'
        | 'sending'
        | 'sent'
        | 'end:received'
        | 'end:cancelled';
    sentOffset: number;
    ackOffset: number;
}

type FileSendHandleProgressHandler = (event: FileSendHandleEvent) => void;

// Using a chunk size of 8KB
const CHUNK_SIZE = 8 * 1024;

class FileSendHandle {
    public readyState:
        | 'queued'
        | 'sending'
        | 'sent'
        | 'end:received'
        | 'end:cancelled';
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
            this.readyState !== 'end:received',
            'Invariant: cannot cancel received file'
        );
        this.readyState = 'end:cancelled';
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
            'Invariant: bad state',
            { readyState: this.readyState }
        );
        if (this.readyState === 'queued') {
            this.readyState = 'sending';
        }
        assert(
            this.sentOffset < sentOffset,
            'Invariant: onSent called with earlier sent offset'
        );
        assert(
            sentOffset <= this.size,
            'Invariant: onSent called with too large size'
        );
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
            'Invariant: bad state',
            { readyState: this.readyState }
        );
        if (ackOffset < this.ackOffset) {
            console.warn(
                'Unexpected onAck: onAck called with earlier sent offset',
                {
                    receivedAckOffset: ackOffset,
                    currentAckOffset: this.ackOffset,
                }
            );
            return;
        }
        if (this.size < ackOffset) {
            console.warn('Invariant: onSent called with too large size', {
                receivedAckOffset: ackOffset,
                size: this.size,
            });
            return;
        }
        this.ackOffset = ackOffset;
        if (this.ackOffset === this.size) {
            this.readyState = 'end:received';
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
// - [x] Accept a queue of files
// - [x] Upload them one by one to the peer in <16k messages
// - [x] Recipients need to ack each message?
// - [ ] Chat messages need to have a placeholder for the sent/received files
export class FileSendQueue implements Disposable {
    public queue: Collection<FileSendQueueItem>;
    private connected: boolean;
    private connectionSubscription: () => void;
    private maxId: number;
    private itemToHandle: Map<FileSendQueueItem, FileSendHandle>;
    private chunkSize: number;
    private peer: PeerService;

    constructor(peer: PeerService, chunkSize: number = CHUNK_SIZE) {
        this.peer = peer;
        this.chunkSize = chunkSize;
        this.maxId = 0;
        this.queue = collection([]);
        this.itemToHandle = new Map();
        this.connected = false;
        this.connectionSubscription = this.peer.connectionState.subscribe(
            (err, value) => {
                if (!err) {
                    this.connected = value === 'connected';
                    this.pump();
                }
            }
        );
        this.peer.onMessage(this.onPeerMessage);
    }

    dispose() {
        this.queue.reject(() => true);
        this.connectionSubscription();
    }

    private getNextActiveItem() {
        for (let i = 0; i < this.queue.length; ++i) {
            const item = this.queue[i];
            if (
                item.readyState.get() !== 'end:received' &&
                item.readyState.get() !== 'end:cancelled'
            ) {
                return item;
            }
        }
        return null;
    }

    [Symbol.dispose]() {
        this.dispose();
    }

    private onPeerMessage = (message: string) => {
        let decoded: unknown;
        try {
            decoded = JSON.parse(message);
        } catch (e) {
            console.warn('Received non-JSON-encoded value', e);
            return;
        }
        if (isFileAckMessage(decoded)) {
            const id = decoded.id;
            const item = this.getNextActiveItem();
            if (!item) {
                console.warn(
                    'FileSendQueue: Received ack for file, but queue has no active items',
                    { message: decoded }
                );
                return;
            }
            if (item.id !== id) {
                console.warn(
                    'FileSendQueue: Received ack for file, but different file on top of queue',
                    { message: decoded, topOfQueue: item }
                );
                return;
            }
            const handle = this.itemToHandle.get(item);
            assert(
                handle,
                'FileSendQueue: handle not found for item during file ack'
            );
            handle.onAck(decoded.offset);
            this.pump();
        }
    };

    async sendFile({
        fileName,
        contentType,
        blob,
    }: {
        fileName: string;
        contentType: string;
        blob: Blob;
    }): Promise<FileSendHandle> {
        const id = `file_${this.maxId++}`;
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const size = bytes.length;
        const queueItem: FileSendQueueItem = {
            id,
            fileName,
            contentType,
            bytes,
            size,
            sentOffset: field(0),
            ackOffset: field(0),
            readyState: field('queued'),
        };
        const handle = new FileSendHandle(size, () => {
            assert(
                this.itemToHandle.has(queueItem),
                'FileSendQueue invariant: cancelled twice'
            );
            this.itemToHandle.delete(queueItem);
            this.pump();
        });
        const onProgress = (event: FileSendHandleEvent) => {
            queueItem.readyState.set(event.readyState);
            queueItem.sentOffset.set(event.sentOffset);
            queueItem.ackOffset.set(event.ackOffset);
        };
        handle.addEventListener('progress', onProgress);
        this.queue.push(queueItem);
        this.itemToHandle.set(queueItem, handle);
        this.pump();
        return handle;
    }

    private pump() {
        if (!this.connected) {
            return;
        }
        const item = this.getNextActiveItem();
        if (!item) {
            return;
        }
        const handle = this.itemToHandle.get(item);
        assert(handle, 'FileSendQueue invariant: item in queue missing handle');
        switch (item.readyState.get()) {
            case 'queued':
            case 'sending': {
                const ackOffset = item.ackOffset.get();
                const offset = item.sentOffset.get();
                if (ackOffset < offset) {
                    // Still waiting for messages to be received
                    return;
                }
                const endOffset = Math.min(offset + this.chunkSize, item.size);
                const chunk = item.bytes.slice(offset, endOffset);
                this.peer.send(
                    encodeFilePushMessage({
                        type: 'file:chunk',
                        id: item.id,
                        size: item.size,
                        offset,
                        base64: bytesToBase64(chunk),
                    })
                );
                handle.onSent(endOffset);
                break;
            }
            case 'sent':
                // Do nothing; we need to wait for the other side to acknowledge
                return;
            case 'end:received':
            case 'end:cancelled':
                assert(
                    false,
                    'FileSendQueue item invariant: pumped item in unexpected state',
                    item.readyState.get()
                );
                break;
        }
    }
}
