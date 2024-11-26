import { field } from '@srhazi/gooey';
import type { Field } from '@srhazi/gooey';

import { isArray, isEither, isExact, isShape, isString } from './shape';
import type { CheckType } from './shape';
import { assert, assertResolves, makePromise, wrapError } from './utils';

// Server: create offer
// Client: accept offer and create answer
// Server: accept answer

export const isOffer = isShape({
    type: isExact('offer'),
    sdp: isString,
});

export const isAnswer = isShape({
    type: isExact('answer'),
    sdp: isString,
});

export const isCandidateList = isArray(
    isShape({
        candidate: isString,
    })
);

export const isNegotiateOffer = isShape({
    type: isExact('negotiateOffer'),
    offer: isOffer,
    candidates: isCandidateList,
});

export const isNegotiateAnswer = isShape({
    type: isExact('negotiateAnswer'),
    answer: isAnswer,
    candidates: isCandidateList,
});

export const isNormalMessage = isShape({
    type: isExact('normal'),
    message: isString,
});

export const isRenegotiateRequest = isShape({
    type: isExact('renegotiateRequest'),
    offer: isOffer,
});

export const isRenegotiateResponse = isShape({
    type: isExact('renegotiateResponse'),
    answer: isAnswer,
});

export const isChannelSpecialMessage = isEither(
    isRenegotiateRequest,
    isRenegotiateResponse
);
export const isChannelMessage = isEither(
    isNormalMessage,
    isChannelSpecialMessage
);
export type ChannelMessage = CheckType<typeof isChannelMessage>;
export type ChannelSpecialMessage = CheckType<typeof isChannelSpecialMessage>;

export async function encodeNegotiateOffer(
    negotiateOffer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
): Promise<string> {
    return await compress(
        JSON.stringify({
            type: 'negotiateOffer',
            offer: negotiateOffer,
            candidates: iceCandidates,
        })
    );
}

export async function decodeNegotiateOffer(encoded: string) {
    let decoded: unknown;
    try {
        decoded = JSON.parse(await decompress(encoded));
    } catch (e) {
        throw new Error(
            `Failed decoding offer: ${e instanceof Error ? e.message : 'unknown error'}`,
            { cause: e }
        );
    }
    assert(
        isNegotiateOffer(decoded),
        'Failed decoding offer: unexpected decoded result'
    );
    return decoded;
}

/** Per https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings */
export function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

export function bytesToBase64(bytes: Uint8Array) {
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte)
    ).join('');
    return btoa(binString);
}

export async function compress(str: string): Promise<string> {
    const compressionStream = new CompressionStream('gzip');
    const blob = new Blob([str]);
    const compressed = blob.stream().pipeThrough<Uint8Array>(compressionStream);
    const reader = compressed.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
        const chunk = await reader.read();
        if (chunk.done) {
            break;
        } else if (chunk.value instanceof Uint8Array) {
            chunks.push(chunk.value);
        } else {
            console.error('Unexpected chunk kind');
            throw new Error('Unexpected chunk kind');
        }
    }
    const combined = new Blob(chunks);
    const combinedBuffer = await combined.arrayBuffer();
    const bytes = new Uint8Array(combinedBuffer);
    const result = bytesToBase64(bytes);
    return result;
}

export async function decompress(str: string): Promise<string> {
    const compressed = base64ToBytes(str);
    const compressedBlob = new Blob([compressed]);
    const decompressionStream = new DecompressionStream('gzip');
    const reader = compressedBlob
        .stream()
        .pipeThrough<Uint8Array>(decompressionStream)
        .getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
        const chunk = await reader.read();
        if (chunk.done) {
            break;
        } else if (chunk.value instanceof Uint8Array) {
            chunks.push(chunk.value);
        } else {
            console.error('Unexpected chunk kind');
            throw new Error('Unexpected chunk kind');
        }
    }
    const combined = new Blob(chunks);
    const combinedBuffer = await combined.arrayBuffer();
    const decoder = new TextDecoder();
    const result = decoder.decode(combinedBuffer);
    return result;
}

export async function encodeNegotiateAnswer(
    negotiateAnswer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
): Promise<string> {
    return await compress(
        JSON.stringify({
            type: 'negotiateAnswer',
            answer: negotiateAnswer,
            candidates: iceCandidates,
        })
    );
}

export async function decodeNegotiateAnswer(encoded: string) {
    let decoded: unknown;
    try {
        decoded = JSON.parse(await decompress(encoded));
    } catch (e) {
        throw new Error(
            `Failed decoding answer: ${e instanceof Error ? e.message : 'unknown error'}`,
            { cause: e }
        );
    }
    assert(
        isNegotiateAnswer(decoded),
        'Failed decoding answer: unexpected decoded result'
    );
    return decoded;
}
