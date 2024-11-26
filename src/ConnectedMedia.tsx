import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component, Dyn } from '@srhazi/gooey';

import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { classes } from './classes';
import type { DynamicMediaStream } from './DynamicMediaStream';
import { Icon } from './Icon';
import { Modal } from './Modal';
import { svc } from './svc';

import './ConnectedMedia.css';

const ConnectedMediaStream: Component<{
    class?: Dyn<string | undefined>;
    dynamicMediaStream: DynamicMediaStream;
    onClick: (el: HTMLElement) => void;
}> = ({ class: className, onClick, dynamicMediaStream }) => {
    const isVideoEnabled = calc(() => {
        return dynamicMediaStream.dynamicTracks.some((dynamicTrack) => {
            if (dynamicTrack.kind === 'video') {
                return dynamicTrack.enabled.get();
            }
            return false;
        });
    });
    const isAudioEnabled = calc(() => {
        return dynamicMediaStream.dynamicTracks.some((dynamicTrack) => {
            if (dynamicTrack.kind === 'audio') {
                return dynamicTrack.enabled.get();
            }
            return false;
        });
    });
    const hasVideo = calc(() =>
        dynamicMediaStream.dynamicTracks.some(
            (dynamicTrack) => dynamicTrack.kind === 'video'
        )
    );
    const hasAudio = calc(() =>
        dynamicMediaStream.dynamicTracks.some(
            (dynamicTrack) => dynamicTrack.kind === 'audio'
        )
    );
    const toggleVideoMute = (e: MouseEvent) => {
        e.preventDefault();
        const isEnabled = isVideoEnabled.get();
        for (const dynamicTrack of dynamicMediaStream.dynamicTracks) {
            if (dynamicTrack.kind === 'video') {
                dynamicTrack.setEnabled(!isEnabled);
            }
        }
    };
    const toggleAudioMute = (e: MouseEvent) => {
        e.preventDefault();
        const isEnabled = isAudioEnabled.get();
        for (const dynamicTrack of dynamicMediaStream.dynamicTracks) {
            if (dynamicTrack.kind === 'audio') {
                dynamicTrack.setEnabled(!isEnabled);
            }
        }
    };
    return (
        <div class={classes('ConnectedMediaStream', className)}>
            <span class="ConnectedMediaStream_who">
                {dynamicMediaStream.isLocal ? 'You' : 'Your Friend'}(
                {calc(() =>
                    dynamicMediaStream.dynamicTracks
                        .map((dynamicTrack) => `${dynamicTrack.kind}`)
                        .join('/')
                )}
                )
            </span>
            {calc(() => {
                const videoEl = dynamicMediaStream.videoElement.get();
                return videoEl ? (
                    videoEl
                ) : (
                    <div class="ConnectedMediaStream_noVideoPlaceholder">
                        <Icon type="videoOff" />
                    </div>
                );
            })}
            {dynamicMediaStream.audioElement}
            <Button
                class="ConnectedMediaStream_muteVideoToggle"
                disabled={calc(() => !hasVideo.get())}
                on:click={toggleVideoMute}
            >
                {calc(() => {
                    if (hasVideo.get()) {
                        return isVideoEnabled.get() ? (
                            <>
                                <Icon type="videoOn" /> Video On
                            </>
                        ) : (
                            <>
                                <Icon type="videoOff" /> Video Off
                            </>
                        );
                    }
                    return (
                        <>
                            <Icon type="videoOff" /> No Video
                        </>
                    );
                })}
            </Button>
            <Button
                class="ConnectedMediaStream_muteAudioToggle"
                disabled={calc(() => !hasAudio.get())}
                on:click={toggleAudioMute}
            >
                {calc(() => {
                    if (hasAudio.get()) {
                        return isAudioEnabled.get() ? (
                            <>
                                <Icon type="audioOn" /> Audio On
                            </>
                        ) : (
                            <>
                                <Icon type="audioOff" /> Audio Off
                            </>
                        );
                    }
                    return (
                        <>
                            <Icon type="audioOff" /> No Audio
                        </>
                    );
                })}
            </Button>
        </div>
    );
};

const ConnectedMediaStreamManager: Component<{
    dynamicMediaStream: DynamicMediaStream;
}> = ({ dynamicMediaStream }) => {
    return (
        <div>
            {dynamicMediaStream.dynamicTracks.mapView((dynamicTrack) => {
                return (
                    <fieldset>
                        <legend>{dynamicTrack.kind}</legend>
                        <Checkbox disabled checked={dynamicTrack.enabled}>
                            Enabled
                        </Checkbox>
                        <Checkbox disabled checked={dynamicTrack.muted}>
                            Muted
                        </Checkbox>
                    </fieldset>
                );
            })}
        </div>
    );
};

export const ConnectedMedia: Component<{
    class?: Dyn<string | undefined>;
}> = ({ class: className }) => {
    const configureStream = field<undefined | DynamicMediaStream>(undefined);
    return (
        <>
            <div class={classes('ConnectedMedia', className)}>
                {svc('state').dynamicMediaStreams.dynamicStreams.mapView(
                    (dynamicStream) => (
                        <ConnectedMediaStream
                            onClick={() => configureStream.set(dynamicStream)}
                            dynamicMediaStream={dynamicStream}
                        />
                    )
                )}
            </div>
            <Modal
                title={
                    <>
                        {calc(() =>
                            configureStream.get()?.isLocal
                                ? 'My Stream'
                                : "Your Friend's Stream"
                        )}
                    </>
                }
                open={calc(() => !!configureStream.get())}
                onSave={() => {
                    return true;
                }}
                onClose={() => configureStream.set(undefined)}
            >
                {calc(() => {
                    const dynamicMediaStream = configureStream.get();
                    if (!dynamicMediaStream) {
                        return null;
                    }
                    return (
                        <ConnectedMediaStreamManager
                            dynamicMediaStream={dynamicMediaStream}
                        />
                    );
                })}
            </Modal>
        </>
    );
};
