import { field } from '@srhazi/gooey';
import type { Field } from '@srhazi/gooey';

export class DynamicMediaStreamTrack implements Disposable {
    private track: MediaStreamTrack;
    muted: Field<boolean>;
    enabled: Field<boolean>;
    readyState: Field<MediaStreamTrackState>;

    private pollHandle: ReturnType<typeof setInterval>;

    constructor(track: MediaStreamTrack) {
        this.track = track;
        this.muted = field(track.muted);
        this.enabled = field(track.enabled);
        this.readyState = field(track.readyState);
        this.track.addEventListener('ended', this.onEnded);
        this.track.addEventListener('mute', this.onMuteOrUnmute);
        this.track.addEventListener('unmute', this.onMuteOrUnmute);
        this.pollHandle = setInterval(() => {
            this.muted.set(track.muted);
            this.enabled.set(track.enabled);
            this.readyState.set(track.readyState);
        }, 100);
    }

    get id() {
        return this.track.id;
    }

    get kind() {
        return this.track.kind;
    }

    onEnded = (e: Event) => {
        this.readyState.set(this.track.readyState);
        this.enabled.set(this.track.enabled);
    };

    getTrack() {
        return this.track;
    }

    onMuteOrUnmute = (e: Event) => {
        this.muted.set(this.track.muted);
    };

    setEnabled(isEnabled: boolean) {
        this.track.enabled = isEnabled;
        this.enabled.set(isEnabled);
    }

    dispose() {
        clearInterval(this.pollHandle);
        this.track.removeEventListener('ended', this.onEnded);
        this.track.removeEventListener('mute', this.onMuteOrUnmute);
        this.track.removeEventListener('unmute', this.onMuteOrUnmute);
        this.track.enabled = false;
    }

    [Symbol.dispose]() {
        this.dispose();
    }
}
