import type { Calculation, Field } from '@srhazi/gooey';

export type PeerMessageHandler = (message: string) => void;

export type PeerTrackHandler = (
    track: MediaStreamTrack,
    streams: readonly MediaStream[],
    tranceiver: RTCRtpTransceiver
) => void;
export type PeerRenegotiatingState = undefined | 'renegotiate-sent';

export interface PeerService {
    channelReadyState: Calculation<RTCDataChannelState | null>;

    connectionState: Field<RTCPeerConnectionState>;
    iceConnectionState: Field<RTCIceConnectionState>;
    iceGatheringState: Field<RTCIceGatheringState>;
    signalingState: Field<RTCSignalingState>;

    onMessage: (handler: PeerMessageHandler) => () => void;

    onTrack: (handler: PeerTrackHandler) => () => void;

    addTrack: (
        track: MediaStreamTrack,
        mediaStream: MediaStream
    ) => RTCRtpSender;

    removeTrack: (sender: RTCRtpSender) => void;

    send: (message: string) => void;

    start: () => void;

    accept: (encodedOffer: string) => Promise<void>;
}
