import type { Field } from '@srhazi/gooey';

import type { ChannelSpecialMessage } from './peerMessages';

export type PeerChannelHandler = (
    ...args:
        | [error: Error, message: undefined]
        | [error: undefined, message: string]
) => void;

export type PeerChannelSpecialHandler = (
    message: ChannelSpecialMessage
) => void;

export type PeerMessageHandler = (message: string) => void;

export type PeerTrackHandler = (
    track: MediaStreamTrack,
    streams: readonly MediaStream[],
    tranceiver: RTCRtpTransceiver
) => void;
export type PeerRenegotiatingState = undefined | 'renegotiate-sent';

export interface PeerChannel {
    readyState: Field<RTCDataChannelState>;

    onMessageReceived: (event: MessageEvent) => void;
    send: (msg: string) => void;
    sendSpecial: (msg: ChannelSpecialMessage) => void;
}

export interface PeerService {
    handler: (toSend: string) => Promise<string>;
    channel: Field<PeerChannel | undefined>;

    connectionState: Field<RTCPeerConnectionState>;
    iceConnectionState: Field<RTCIceConnectionState>;
    iceGatheringState: Field<RTCIceGatheringState>;
    signalingState: Field<RTCSignalingState>;

    iceCandidates: RTCIceCandidate[];
    iceCandidatesPromise: {
        promise: Promise<RTCIceCandidate[]>;
        resolve: (candidates: RTCIceCandidate[]) => void;
        reject: (error: any) => void;
    };

    onChannelSpecialMessage: PeerChannelSpecialHandler;

    onMessage: (handler: PeerMessageHandler) => () => void;

    onTrack: (handler: PeerTrackHandler) => () => void;

    addTrack: (
        track: MediaStreamTrack,
        mediaStream: MediaStream
    ) => RTCRtpSender;

    removeTrack: (sender: RTCRtpSender) => void;

    onChannelMessage: PeerChannelHandler;

    onChannelTrack: PeerTrackHandler;

    send: (message: string) => void;

    start: () => void;

    accept: (encodedOffer: string) => Promise<void>;
}
