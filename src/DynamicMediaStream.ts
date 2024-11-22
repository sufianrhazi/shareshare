import { collection, field } from '@srhazi/gooey';
import type { Collection, Field } from '@srhazi/gooey';

import { DynamicMediaStreamTrack } from './DynamicMediaStreamTrack';
import type { Peer } from './Peer';

export type DynamicMediaStreamProps =
    | {
          isLocal: true;
          peer: Peer;
          mediaStream: MediaStream;
          senders: RTCRtpSender[];
      }
    | {
          isLocal: false;
          peer: Peer;
          mediaStream: MediaStream;
          tranceiver: RTCRtpTransceiver;
      };

export class DynamicMediaStream implements Disposable {
    public isLocal: boolean;
    private mediaStream: MediaStream;
    public peer: Peer;
    public senders: undefined | RTCRtpSender[];
    public tranceiver: undefined | RTCRtpTransceiver;
    public dynamicTracks: Collection<DynamicMediaStreamTrack>;
    public videoElement: Field<HTMLVideoElement | undefined>;
    public audioElement: Field<HTMLAudioElement | undefined>;

    constructor(props: DynamicMediaStreamProps) {
        this.peer = props.peer;
        this.isLocal = props.isLocal;
        this.mediaStream = props.mediaStream;
        this.senders = props.isLocal ? props.senders : undefined;
        this.tranceiver = props.isLocal ? undefined : props.tranceiver;
        this.dynamicTracks = collection([]);
        this.videoElement = field(undefined);
        this.audioElement = field(undefined);
        this.mediaStream.addEventListener('addtrack', this.onAddTrack);
        this.mediaStream.addEventListener('removetrack', this.onRemoveTrack);
        for (const track of this.mediaStream.getTracks()) {
            this.addTrack(track);
        }
    }

    get id() {
        return this.mediaStream.id;
    }

    onAddTrack = (e: MediaStreamTrackEvent) => {
        console.log('DynamicMediaStream event:addtrack', e);
        this.addTrack(e.track);
    };

    onRemoveTrack = (e: MediaStreamTrackEvent) => {
        console.log('DynamicMediaStream event:removetrack', e);
        this.removeTrack(e.track);
    };

    private updateElements() {
        const videoElement = this.videoElement.get();
        const hasVideoTrack = this.dynamicTracks.some(
            (dynamicTrack) => dynamicTrack.kind === 'video'
        );
        if (videoElement && !hasVideoTrack) {
            videoElement.pause();
            this.videoElement.set(undefined);
        } else if (!videoElement && hasVideoTrack) {
            const video = document.createElement('video');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            video.setAttribute(
                'controlslist',
                'nodownload nofullscreen noremoteplayback'
            );
            video.srcObject = this.mediaStream;
            this.videoElement.set(video);
        }

        const audioElement = this.audioElement.get();
        const hasAudioTrack = this.dynamicTracks.some(
            (dynamicTrack) => dynamicTrack.kind === 'audio'
        );
        if (audioElement && !hasAudioTrack) {
            audioElement.pause();
            this.audioElement.set(undefined);
        } else if (!audioElement && hasAudioTrack) {
            const audio = document.createElement('audio');
            audio.setAttribute('autoplay', '');
            audio.setAttribute(
                'controlslist',
                'nodownload nofullscreen noremoteplayback'
            );
            audio.srcObject = this.mediaStream;
            this.audioElement.set(audio);
        }
    }

    removeTrack(track: MediaStreamTrack) {
        this.dynamicTracks.reject(
            (dynamicTrack) => dynamicTrack.id === track.id
        );
        this.updateElements();
    }

    addTrack(track: MediaStreamTrack) {
        const existing = this.dynamicTracks.find(
            (dynamicTrack) => dynamicTrack.id === track.id
        );
        if (existing) {
            return;
        }
        this.dynamicTracks.push(new DynamicMediaStreamTrack(track));
        this.updateElements();
    }

    dispose() {
        console.log(
            'DISPOSING DynamicMediaStream',
            this.id,
            this.isLocal ? 'local' : 'remote'
        );
        for (const dynamicTrack of this.dynamicTracks) {
            console.log(
                'Removing DynamicMediaStream track',
                dynamicTrack.id,
                dynamicTrack.kind
            );
            this.mediaStream.removeTrack(dynamicTrack.getTrack());
            dynamicTrack.dispose();
        }
        this.dynamicTracks.splice(0, this.dynamicTracks.length);
        this.mediaStream.removeEventListener('addtrack', this.onAddTrack);
        this.mediaStream.removeEventListener('removetrack', this.onRemoveTrack);
        if (this.senders) {
            for (const sender of this.senders) {
                console.log('Removing DynamicMediaStream sender', sender);
                this.peer.peerConnection.removeTrack(sender);
            }
        }
        if (this.tranceiver) {
            this.tranceiver.stop();
        }
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}
