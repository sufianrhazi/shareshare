import type { Field } from '@srhazi/gooey';

export type SentFileStateStatus =
    | 'requested'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'sending'
    | 'sent';

export type SentFileState = {
    id: string;
    status: Field<SentFileStateStatus>;
    ackOffset: Field<number>;
    sendOffset: Field<number>;
    file: File;
    asyncIterator: AsyncGenerator<Uint8Array, void, unknown>;
};

export type ReceivedFileStateStatus =
    | 'requested'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'receiving'
    | 'received';

export type ReceivedFileState = {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    status: Field<ReceivedFileStateStatus>;
    contents: Field<undefined | Uint8Array>;
    lastOffset: Field<number>;
    chunks: string[];
};

export interface FileService {
    setReceivedFileState(id: string, fileState: ReceivedFileState): void;
    getReceivedFileState(id: string): ReceivedFileState | undefined;

    getSentFileState(id: string): SentFileState | undefined;
    setSentFileState(id: string, fileState: SentFileState): void;
}
