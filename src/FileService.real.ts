import type {
    FileService,
    ReceivedFileState,
    SentFileState,
} from './FileService';

export class FileServiceReal implements FileService {
    private sentStateIdToFileState: Map<string, SentFileState>;
    private receivedStateIdToFileState: Map<string, ReceivedFileState>;

    constructor() {
        this.sentStateIdToFileState = new Map();
        this.receivedStateIdToFileState = new Map();
    }

    setReceivedFileState(id: string, fileState: ReceivedFileState): void {
        this.receivedStateIdToFileState.set(id, fileState);
    }

    getReceivedFileState(id: string): ReceivedFileState | undefined {
        return this.receivedStateIdToFileState.get(id);
    }

    setSentFileState(id: string, fileState: SentFileState): void {
        this.sentStateIdToFileState.set(id, fileState);
    }

    getSentFileState(id: string): SentFileState | undefined {
        return this.sentStateIdToFileState.get(id);
    }
}
