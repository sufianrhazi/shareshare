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
export const isWireDataMessage = isEither(
    isWireChatMessage,
    isWireRenameMessage
);

export type WireDataMessage = CheckType<typeof isWireDataMessage>;

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

export const isLocalMessage = isEither(
    isChatMessage,
    isChatRenameMessage,
    isInitialMessage,
    isDisconnectMessage
);

export type LocalMessage = CheckType<typeof isLocalMessage>;
