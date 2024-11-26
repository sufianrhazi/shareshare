import { calc, collection, field } from '@srhazi/gooey';
import type { Calculation, Collection, Field } from '@srhazi/gooey';

import { DynamicMediaStreamTrack } from './DynamicMediaStreamTrack';
import { svc } from './svc';

export type DynamicMediaStreamProps =
    | {
          isLocal: true;
          mediaStream: MediaStream;
          senders: RTCRtpSender[];
      }
    | {
          isLocal: false;
          mediaStream: MediaStream;
          tranceiver: RTCRtpTransceiver;
      };

export class DynamicMediaStream implements Disposable {
    public isLocal: boolean;
    private mediaStream: MediaStream;
    public senders: undefined | RTCRtpSender[];
    public tranceiver: undefined | RTCRtpTransceiver;
    public dynamicTracks: Collection<DynamicMediaStreamTrack>;
    public videoElement: Field<HTMLVideoElement | undefined>;
    public audioElement: Field<HTMLAudioElement | undefined>;
    public hasTracks: Calculation<boolean>;

    constructor(props: DynamicMediaStreamProps) {
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
        this.hasTracks = calc(() => this.dynamicTracks.length > 0);
    }

    get id() {
        return this.mediaStream.id;
    }

    onAddTrack = (e: MediaStreamTrackEvent) => {
        this.addTrack(e.track);
    };

    onRemoveTrack = (e: MediaStreamTrackEvent) => {
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
        for (const dynamicTrack of this.dynamicTracks) {
            this.mediaStream.removeTrack(dynamicTrack.getTrack());
            dynamicTrack.dispose();
        }
        this.dynamicTracks.splice(0, this.dynamicTracks.length);
        this.mediaStream.removeEventListener('addtrack', this.onAddTrack);
        this.mediaStream.removeEventListener('removetrack', this.onRemoveTrack);
        if (this.senders) {
            for (const sender of this.senders) {
                svc('peer').removeTrack(sender);
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
