import Gooey, { calc, ClassComponent, collection, field } from '@srhazi/gooey';
import type { Collection, Component, EmptyProps, Field } from '@srhazi/gooey';

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

export const isLocalMessage = isEither(isChatMessage, isChatRenameMessage);

export type LocalMessage = CheckType<typeof isLocalMessage>;
