import { calc, field } from '@srhazi/gooey';
import type { Calculation, Field } from '@srhazi/gooey';

import type { PeerMessageHandler, PeerService, PeerTrackHandler } from './Peer';

export class PeerFake implements PeerService {
    public channelReadyState: Calculation<RTCDataChannelState | null>;
    private channelReadyStateField: Field<RTCDataChannelState | null>;

    public connectionState: Field<RTCPeerConnectionState>;
    public iceConnectionState: Field<RTCIceConnectionState>;
    public iceGatheringState: Field<RTCIceGatheringState>;
    public signalingState: Field<RTCSignalingState>;

    private messageHandlers: Set<PeerMessageHandler>;
    private trackHandlers: Set<PeerTrackHandler>;
    private tracks: Map<
        RTCRtpSender,
        { track: MediaStreamTrack; mediaStream: MediaStream }
    >;
    private sentMessages: string[];

    constructor() {
        this.channelReadyStateField = field(null);
        this.channelReadyState = calc(() => this.channelReadyStateField.get());
        this.connectionState = field('connected');
        this.iceConnectionState = field('completed');
        this.iceGatheringState = field('complete');
        this.signalingState = field('stable');
        this.messageHandlers = new Set();
        this.trackHandlers = new Set();
        this.tracks = new Map();
        this.sentMessages = [];
    }

    onMessage(handler: PeerMessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    onTrack(handler: PeerTrackHandler): () => void {
        this.trackHandlers.add(handler);
        return () => {
            this.trackHandlers.delete(handler);
        };
    }

    addTrack(track: MediaStreamTrack, mediaStream: MediaStream): RTCRtpSender {
        const sender = new RTCRtpSender();
        this.tracks.set(sender, { track, mediaStream });
        return sender;
    }

    removeTrack(sender: RTCRtpSender): void {
        this.tracks.delete(sender);
    }

    send(message: string): void {
        this.sentMessages.push(message);
    }

    start(): void {
        throw new Error('Not implemented');
    }

    accept(encodedOffer: string): Promise<void> {
        return Promise.reject(new Error('Not implemented'));
    }

    _testGetSentMessages() {
        return this.sentMessages;
    }

    _testReceiveMessage(message: string) {
        for (const handler of this.messageHandlers) {
            handler(message);
        }
    }
}
