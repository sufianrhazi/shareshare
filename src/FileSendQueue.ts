import type { Calculation, Collection, Field } from '@srhazi/gooey';
import { collection } from '@srhazi/gooey';

interface FileSendQueueItem {
    fileName: string;
    contentType: string;
    bytes: Uint8Array;
    size: number;
    sentOffset: Field<number>;
    ackOffset: Field<number>;
    done: Calculation<boolean>;
}

// Responsibility:
// - Accept a queue of files
// - Upload them one by one to the peer in <16k messages
// - Recipients need to ack each message?
// - Chat messages need to have a placeholder for the sent/received files
export class FileSendQueue {
    queue: Collection<FileSendQueueItem>;

    constructor() {
        this.queue = collection([]);
    }
}
