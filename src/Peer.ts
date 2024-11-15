import { field } from '@srhazi/gooey';
import type { Field } from '@srhazi/gooey';

import { isArray, isEither, isExact, isShape, isString } from './shape';
import type { CheckType } from './shape';
import { assert, assertResolves, makePromise, wrapError } from './utils';

// Server: create offer
// Client: accept offer and create answer
// Server: accept answer

const isOffer = isShape({
    type: isExact('offer'),
    sdp: isString,
});

const isAnswer = isShape({
    type: isExact('answer'),
    sdp: isString,
});

const isCandidateList = isArray(
    isShape({
        candidate: isString,
    })
);

const isNegotiateOffer = isShape({
    type: isExact('negotiateOffer'),
    offer: isOffer,
    candidates: isCandidateList,
});

const isNegotiateAnswer = isShape({
    type: isExact('negotiateAnswer'),
    answer: isAnswer,
    candidates: isCandidateList,
});

const isNormalMessage = isShape({
    type: isExact('normal'),
    message: isString,
});

const isRenegotiateRequest = isShape({
    type: isExact('renegotiateRequest'),
    offer: isOffer,
});

const isRenegotiateResponse = isShape({
    type: isExact('renegotiateResponse'),
    answer: isAnswer,
});

const isChannelSpecialMessage = isEither(
    isRenegotiateRequest,
    isRenegotiateResponse
);
const isChannelMessage = isEither(isNormalMessage, isChannelSpecialMessage);
type ChannelMessage = CheckType<typeof isChannelMessage>;
type ChannelSpecialMessage = CheckType<typeof isChannelSpecialMessage>;

function encodeNegotiateOffer(
    negotiateOffer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
): string {
    return btoa(
        JSON.stringify({
            type: 'negotiateOffer',
            offer: negotiateOffer,
            candidates: iceCandidates,
        })
    );
}

function decodeNegotiateOffer(encoded: string) {
    let decoded: unknown;
    try {
        decoded = JSON.parse(atob(encoded));
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

function encodeNegotiateAnswer(
    negotiateAnswer: RTCSessionDescriptionInit,
    iceCandidates: RTCIceCandidate[]
): string {
    return btoa(
        JSON.stringify({
            type: 'negotiateAnswer',
            answer: negotiateAnswer,
            candidates: iceCandidates,
        })
    );
}

function decodeNegotiateAnswer(encoded: string) {
    let decoded: unknown;
    try {
        decoded = JSON.parse(atob(encoded));
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

type PeerChannelHandler = (
    ...args:
        | [error: Error, message: undefined]
        | [error: undefined, message: string]
) => void;
type PeerChannelSpecialHandler = (message: ChannelSpecialMessage) => void;

class PeerChannel {
    private channel: RTCDataChannel;
    private handler: PeerChannelHandler;
    private specialHandler: PeerChannelSpecialHandler;
    readyState: Field<RTCDataChannelState>;

    constructor(
        channel: RTCDataChannel,
        handler: PeerChannelHandler,
        specialHandler: PeerChannelSpecialHandler
    ) {
        this.channel = channel;
        this.handler = handler;
        this.specialHandler = specialHandler;
        this.readyState = field(channel.readyState);
        this.channel.addEventListener('closing', this.onReadyStateChange);
        this.channel.addEventListener('open', this.onReadyStateChange);
        this.channel.addEventListener('close', this.onReadyStateChange);
        this.channel.addEventListener('message', this.onMessageReceived);
    }

    onReadyStateChange = () => {
        this.readyState.set(this.channel.readyState);
    };

    notifyMessage(
        ...args:
            | [error: Error, message: undefined]
            | [error: undefined, message: ChannelMessage]
    ) {
        const [error, message] = args;
        if (error) {
            this.handler(error, undefined);
        } else if (message.type === 'normal') {
            this.handler(undefined, message.message);
        }
        if (!error && message.type !== 'normal') {
            this.specialHandler(message);
        }
    }

    onMessageReceived = (event: MessageEvent) => {
        const data: unknown = event.data;
        if (typeof data !== 'string') {
            this.notifyMessage(new Error('Unexpected message'), undefined);
            return;
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(data);
        } catch (e) {
            this.notifyMessage(wrapError(e), undefined);
            return;
        }
        if (isChannelMessage(parsed)) {
            this.notifyMessage(undefined, parsed);
        } else {
            this.notifyMessage(new Error('Unexpected message'), undefined);
        }
    };

    send(msg: string) {
        this.channel.send(JSON.stringify({ type: 'normal', message: msg }));
    }

    sendSpecial(msg: ChannelSpecialMessage) {
        this.channel.send(JSON.stringify(msg));
    }
}

type PeerMessageHandler = (message: string) => void;
type PeerTrackHandler = (
    track: MediaStreamTrack,
    streams: readonly MediaStream[]
) => void;
type PeerRenegotiatingState = undefined | 'renegotiate-sent';

export class Peer {
    handler: (toSend: string) => Promise<string>;
    channel: Field<PeerChannel | undefined>;

    messageHandlers: Set<PeerMessageHandler>;
    trackHandlers: Set<PeerTrackHandler>;

    peerConnection: RTCPeerConnection;
    connectionState: Field<RTCPeerConnectionState>;
    iceConnectionState: Field<RTCIceConnectionState>;
    iceGatheringState: Field<RTCIceGatheringState>;
    signalingState: Field<RTCSignalingState>;
    private renegotiateState: PeerRenegotiatingState;

    iceCandidates: RTCIceCandidate[];
    iceCandidatesPromise: {
        promise: Promise<RTCIceCandidate[]>;
        resolve: (candidates: RTCIceCandidate[]) => void;
        reject: (error: any) => void;
    };
    connectedPromise: {
        promise: Promise<void>;
        resolve: () => void;
        reject: (error: any) => void;
    };

    constructor(
        handler: (toSend: string) => Promise<string>,
        options: RTCConfiguration = {
            iceServers: [{ urls: 'stun:abstract.properties:3478' }],
        }
    ) {
        this.messageHandlers = new Set();
        this.trackHandlers = new Set();
        this.handler = handler;
        this.peerConnection = new RTCPeerConnection(options);
        this.channel = field(undefined);
        this.connectionState = field(this.peerConnection.connectionState);
        this.iceConnectionState = field(this.peerConnection.iceConnectionState);
        this.iceGatheringState = field(this.peerConnection.iceGatheringState);
        this.signalingState = field(this.peerConnection.signalingState);
        this.renegotiateState = undefined;

        this.iceCandidatesPromise = makePromise<RTCIceCandidate[]>();
        this.connectedPromise = makePromise<void>();

        this.iceCandidates = [];
        this.peerConnection.addEventListener('connectionstatechange', (e) => {
            console.log(
                'CONNECTIONSTATECHANGE',
                this.peerConnection.connectionState
            );
            this.connectionState.set(this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.connectedPromise.resolve();
            } else if (this.peerConnection.connectionState === 'failed') {
                this.connectedPromise.reject(new Error('Unable to connect'));
            }
        });
        this.peerConnection.addEventListener('icecandidate', (e) => {
            console.log('client icecandidate', e.candidate);
            if (e.candidate) {
                this.iceCandidates.push(e.candidate);
            }
        });
        this.peerConnection.addEventListener('icegatheringstatechange', (e) => {
            this.iceGatheringState.set(this.peerConnection.iceGatheringState);
            if (this.peerConnection.iceGatheringState === 'complete') {
                if (this.iceCandidates.length > 0) {
                    this.iceCandidatesPromise.resolve(this.iceCandidates);
                } else {
                    this.iceCandidatesPromise.reject(
                        new Error('No ICE Candidates found')
                    );
                }
            }
        });
        this.peerConnection.addEventListener('signalingstatechange', (e) => {
            this.signalingState.set(this.peerConnection.signalingState);
        });
        this.peerConnection.addEventListener('datachannel', (e) => {
            console.log('client datachannel', e.channel);
            assert(!this.channel.get(), 'got multiple channels!');
            const peerChannel = new PeerChannel(
                e.channel,
                this.onChannelMessage,
                this.onChannelSpecialMessage
            );
            this.channel.set(peerChannel);
        });
        this.peerConnection.addEventListener('track', (e) => {
            console.log('client track', e.track);
            this.onChannelTrack(e.track, e.streams);
        });
        this.peerConnection.addEventListener('negotiationneeded', (event) => {
            assertResolves(
                (async () => {
                    const peerChannel = this.channel.get();
                    if (
                        this.peerConnection.connectionState === 'connected' &&
                        peerChannel
                    ) {
                        console.log(
                            'Attempting renegotiation over existing data channel...'
                        );
                        const offer = await this.peerConnection.createOffer();
                        await this.peerConnection.setLocalDescription(
                            new RTCSessionDescription(offer)
                        );
                        peerChannel.sendSpecial({
                            type: 'renegotiateRequest',
                            offer: offer as CheckType<typeof isOffer>,
                        });
                        this.renegotiateState = 'renegotiate-sent';
                        return;
                    }
                    console.log('client negotiationneeded');
                    const offer = await this.peerConnection.createOffer();
                    await this.peerConnection.setLocalDescription(
                        new RTCSessionDescription(offer)
                    );

                    const iceCandidates =
                        await this.iceCandidatesPromise.promise;
                    const { answer, candidates: remoteCandidates } =
                        decodeNegotiateAnswer(
                            await this.handler(
                                encodeNegotiateOffer(offer, iceCandidates)
                            )
                        );
                    await this.peerConnection.setRemoteDescription(
                        new RTCSessionDescription(answer)
                    );

                    for (const candidate of remoteCandidates) {
                        await this.peerConnection.addIceCandidate(candidate);
                    }
                    await this.peerConnection.addIceCandidate();
                })(),
                'negotiationneeded failure'
            );
        });
    }

    connected(): Promise<void> {
        return this.connectedPromise.promise;
    }

    onChannelSpecialMessage: PeerChannelSpecialHandler = (message) => {
        assertResolves(
            (async () => {
                if (message.type === 'renegotiateRequest') {
                    console.log('Received renegotiateRequest...');
                    const offer = message.offer;
                    await this.peerConnection.setRemoteDescription(
                        new RTCSessionDescription(offer)
                    );
                    const answer = await this.peerConnection.createAnswer();
                    await this.peerConnection.setLocalDescription(
                        new RTCSessionDescription(answer)
                    );
                    const peerChannel = this.channel.get();
                    assert(
                        peerChannel,
                        'Invariant: got message on missing channel'
                    );
                    peerChannel.sendSpecial({
                        type: 'renegotiateResponse',
                        answer: answer as CheckType<typeof isAnswer>,
                    });
                }
                if (message.type === 'renegotiateResponse') {
                    if (this.renegotiateState === 'renegotiate-sent') {
                        console.log('Received renegotiateResponse...');
                        const answer = message.answer;
                        await this.peerConnection.setRemoteDescription(
                            new RTCSessionDescription(answer)
                        );
                    } else {
                        console.warn('Got unexpected renegotiateResponse');
                    }
                }
            })(),
            'channel special message failure'
        );
    };

    onMessage(handler: PeerMessageHandler) {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    onTrack(handler: PeerTrackHandler) {
        this.trackHandlers.add(handler);
        return () => {
            this.trackHandlers.delete(handler);
        };
    }

    onChannelMessage: PeerChannelHandler = (error, message) => {
        if (error) {
            console.error(
                'Unexpected error received from primary data channel',
                error
            );
            return;
        }
        for (const handler of this.messageHandlers) {
            handler(message);
        }
    };

    onChannelTrack: PeerTrackHandler = (track, streams) => {
        for (const handler of this.trackHandlers) {
            handler(track, streams);
        }
    };

    send(message: string) {
        const peerChannel = this.channel.get();
        assert(peerChannel, 'Cannot send without a data channel');
        peerChannel.send(message);
    }

    start() {
        const peerChannel = new PeerChannel(
            this.peerConnection.createDataChannel('main'),
            this.onChannelMessage,
            this.onChannelSpecialMessage
        );
        this.channel.set(peerChannel);
    }

    async accept(encodedOffer: string) {
        const { offer, candidates: remoteCandidates } =
            decodeNegotiateOffer(encodedOffer);
        await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        );
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(
            new RTCSessionDescription(answer)
        );
        for (const candidate of remoteCandidates) {
            await this.peerConnection.addIceCandidate(candidate);
        }
        await this.peerConnection.addIceCandidate();
        const iceCandidates = await this.iceCandidatesPromise.promise;

        await this.accept(
            await this.handler(encodeNegotiateAnswer(answer, iceCandidates))
        );
    }
}
