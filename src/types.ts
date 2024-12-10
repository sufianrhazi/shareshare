import { isEither, isExact, isNumber, isShape, isString } from './shape';
import type { CheckType } from './shape';

export const isWireChatMessage = isShape({
    type: isExact('chat'),
    sent: isNumber,
    msg: isString,
});
export const isWireRenameMessage = isShape({
    type: isExact('name'),
    sent: isNumber,
    name: isString,
});

/**
 * Sent from sender -> recipient when a file is requested to be sent
 */
export const isWireSendFileRequest = isShape({
    type: isExact('file_send'),
    sent: isNumber,
    id: isString,
    name: isString,
    mimeType: isString,
    size: isNumber,
});
export type WireSendFileRequest = CheckType<typeof isWireSendFileRequest>;

/**
 * Sent from recipient -> sender when a requested file is accepted
 */
export const isWireSendFileAccept = isShape({
    type: isExact('file_send_accept'),
    sent: isNumber,
    id: isString,
});
export type WireSendFileAccept = CheckType<typeof isWireSendFileAccept>;
/**
 * Sent from recipient -> sender when a requested file is rejected
 */
export const isWireSendFileReject = isShape({
    type: isExact('file_send_reject'),
    sent: isNumber,
    id: isString,
});
export type WireSendFileReject = CheckType<typeof isWireSendFileReject>;
/**
 * Sent from sender -> recipient when a sent file is cancelled mid-send/before accept/reject
 */
export const isWireSendFileCancel = isShape({
    type: isExact('file_send_cancel'),
    sent: isNumber,
    id: isString,
});
export type WireSendFileCancel = CheckType<typeof isWireSendFileCancel>;
/**
 * Sent from sender -> recipient once accepted and after each chunk is received
 */
export const isWireSendFileChunk = isShape({
    type: isExact('file_send_chunk'),
    sent: isNumber,
    id: isString,
    offset: isNumber,
    end: isNumber,
    data: isString,
});
export type WireSendFileChunk = CheckType<typeof isWireSendFileChunk>;
/**
 * Sent from recipient -> sender after acknowledging each chunk
 */
export const isWireSendFileChunkAck = isShape({
    type: isExact('file_send_chunk_ack'),
    sent: isNumber,
    id: isString,
    end: isNumber,
});
export type WireSendFileChunkAck = CheckType<typeof isWireSendFileChunkAck>;
export const isWireMessage = isEither(
    isWireChatMessage,
    isWireRenameMessage,
    isWireSendFileRequest,
    isWireSendFileAccept,
    isWireSendFileReject,
    isWireSendFileCancel,
    isWireSendFileChunk,
    isWireSendFileChunkAck
);

export type WireMessage = CheckType<typeof isWireMessage>;

export const isInitialMessage = isShape({
    type: isExact('chatstart'),
    sent: isNumber,
    from: isExact('peer'),
});

export const isChatRenameMessage = isShape({
    type: isExact('name'),
    sent: isNumber,
    from: isEither(isExact('you'), isExact('peer')),
    priorName: isString,
    name: isString,
});

export const isChatMessage = isShape({
    type: isExact('chat'),
    sent: isNumber,
    from: isEither(isExact('you'), isExact('peer')),
    msg: isString,
});

export const isDisconnectMessage = isShape({
    type: isExact('disconnected'),
});

export const isDirectionalMessage = isEither(
    isChatMessage,
    isChatRenameMessage
);

export const isFileSendMessage = isShape({
    type: isExact('file_send'),
    sent: isNumber,
    from: isExact('you'),
    id: isString,
});

export const isFileReceiveMessage = isShape({
    type: isExact('file_recv'),
    sent: isNumber,
    from: isExact('peer'),
    id: isString,
});

export const isLocalMessage = isEither(
    isChatMessage,
    isChatRenameMessage,
    isFileSendMessage,
    isFileReceiveMessage,
    isInitialMessage,
    isDisconnectMessage
);

export type LocalMessage = CheckType<typeof isLocalMessage>;
