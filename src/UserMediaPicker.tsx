import Gooey, { calc, collection, field, model, ref } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { calc2 } from './calc2';
import { Checkbox } from './Checkbox';
import { mkid } from './mkid';
import { assertResolves } from './utils';

import './UserMediaPicker.css';

const newId = mkid('UserMediaPicker');

// Note: these live as global values, you either are sharing user media/displays or you aren't
const isSharingUserMedia = field(false);

const userMediaDevices = collection<MediaDeviceInfo>([]);

const isSharingUserVideo = field(true);
const isSharingUserAudio = field(true);
const audioInputPreferences = model<
    Pick<
        MediaTrackConstraintSet,
        | 'autoGainControl'
        | 'channelCount'
        | 'deviceId'
        | 'echoCancellation'
        | 'facingMode'
        | 'groupId'
        | 'noiseSuppression'
        | 'sampleRate'
        | 'sampleSize'
    >
>({
    autoGainControl: undefined,
    channelCount: undefined,
    deviceId: 'default',
    echoCancellation: undefined,
    facingMode: undefined,
    groupId: undefined,
    noiseSuppression: undefined,
    sampleRate: undefined,
    sampleSize: undefined,
});
const videoInputPreferences = model<
    Pick<
        MediaTrackConstraintSet,
        | 'aspectRatio'
        | 'deviceId'
        | 'displaySurface'
        | 'facingMode'
        | 'frameRate'
        | 'groupId'
        | 'height'
        | 'width'
    >
>({
    aspectRatio: undefined,
    deviceId: undefined,
    displaySurface: undefined,
    facingMode: undefined,
    frameRate: undefined,
    groupId: undefined,
    height: undefined,
    width: undefined,
});

const updateDevices = async () => {
    await navigator.mediaDevices.enumerateDevices().then((devices) => {
        if (!isSharingUserMedia.get()) {
            return;
        }
        userMediaDevices.splice(0, userMediaDevices.length, ...devices);
    });
};

export const UserMediaPicker: Component<{
    setUserMedia: (mediaStream: MediaStream | undefined) => void;
}> = ({ setUserMedia }, { onMount, onUnmount }) => {
    const id = newId();

    const previewUserMedia = field<undefined | MediaStream>(undefined);

    const videoRef = ref<HTMLVideoElement>();
    const audioRef = ref<HTMLAudioElement>();
    const gainValue = field(0);

    let onFrameHandle: number | undefined;
    const audioContext = new AudioContext();
    let mediaStreamAudioSourceNode: AudioNode | undefined;
    let analyserNode: AnalyserNode | undefined;

    const updatePreview = (mediaStream: MediaStream | undefined) => {
        if (mediaStream) {
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                assertResolves(
                    videoRef.current.play(),
                    'unable to play <video>'
                );
            }
            if (audioRef.current) {
                audioRef.current.srcObject = mediaStream;
                assertResolves(
                    audioRef.current.play(),
                    'unable to play <audio>'
                );
            }
            if (mediaStream.getAudioTracks().length > 0) {
                mediaStreamAudioSourceNode =
                    audioContext.createMediaStreamSource(mediaStream);
                analyserNode = audioContext.createAnalyser();
                mediaStreamAudioSourceNode.connect(analyserNode);

                const pcmData = new Float32Array(analyserNode.fftSize);
                const onFrame = () => {
                    if (!analyserNode) {
                        return;
                    }
                    analyserNode.getFloatTimeDomainData(pcmData);
                    let sumSquares = 0.0;
                    for (const amplitude of pcmData) {
                        sumSquares += amplitude * amplitude;
                    }
                    gainValue.set(Math.sqrt(sumSquares / pcmData.length));
                    onFrameHandle = window.requestAnimationFrame(onFrame);
                };
                onFrameHandle = window.requestAnimationFrame(onFrame);
            }
        } else {
            if (onFrameHandle !== undefined) {
                window.cancelAnimationFrame(onFrameHandle);
                onFrameHandle = undefined;
            }
            if (mediaStreamAudioSourceNode) {
                mediaStreamAudioSourceNode.disconnect();
                mediaStreamAudioSourceNode = undefined;
            }
            if (analyserNode) {
                analyserNode.disconnect();
                analyserNode = undefined;
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.srcObject = null;
            }
        }
    };

    const setPreview = (mediaStream: MediaStream | undefined) => {
        const prevMediaStream = previewUserMedia.get();
        if (prevMediaStream) {
            updatePreview(undefined);
            for (const track of prevMediaStream.getTracks()) {
                track.stop();
            }
        }
        setUserMedia(mediaStream);
        previewUserMedia.set(mediaStream);
        updatePreview(mediaStream);
    };

    onUnmount(() => {
        updatePreview(undefined);
        assertResolves(audioContext.close(), 'Unable to close audioContext');
    });
    onMount(() => {
        const unsubscribeUserMedia = calc2({
            cleanup: (result) => result(),
            fn: () => {
                let cancelled = false;
                let listening = false;
                const sharingUserMedia = isSharingUserMedia.get();
                const sharingUserVideo = isSharingUserVideo.get();
                const sharingUserAudio = isSharingUserAudio.get();
                if (
                    sharingUserMedia &&
                    (sharingUserVideo || sharingUserAudio)
                ) {
                    navigator.mediaDevices
                        .getUserMedia({
                            video: sharingUserVideo
                                ? {
                                      aspectRatio:
                                          videoInputPreferences.aspectRatio,
                                      deviceId: videoInputPreferences.deviceId,
                                      displaySurface:
                                          videoInputPreferences.displaySurface,
                                      facingMode:
                                          videoInputPreferences.facingMode,
                                      frameRate:
                                          videoInputPreferences.frameRate,
                                      groupId: videoInputPreferences.groupId,
                                      height: videoInputPreferences.height,
                                      width: videoInputPreferences.width,
                                  }
                                : false,
                            audio: sharingUserAudio
                                ? {
                                      autoGainControl:
                                          audioInputPreferences.autoGainControl,
                                      channelCount:
                                          audioInputPreferences.channelCount,
                                      deviceId: audioInputPreferences.deviceId,
                                      echoCancellation:
                                          audioInputPreferences.echoCancellation,
                                      facingMode:
                                          audioInputPreferences.facingMode,
                                      groupId: audioInputPreferences.groupId,
                                      noiseSuppression:
                                          audioInputPreferences.noiseSuppression,
                                      sampleRate:
                                          audioInputPreferences.sampleRate,
                                      sampleSize:
                                          audioInputPreferences.sampleSize,
                                  }
                                : false,
                        })
                        .then((media) => {
                            if (cancelled) {
                                return;
                            }
                            setPreview(media);
                            if (!listening) {
                                navigator.mediaDevices.addEventListener(
                                    'devicechange',
                                    () => {
                                        assertResolves(updateDevices());
                                    }
                                );
                                listening = true;
                            }
                            return updateDevices();
                        })
                        .catch((e) => {
                            // TODO: better error state
                            console.error('Error getting user media', e);
                        });

                    return () => {
                        cancelled = true;
                        if (listening) {
                            navigator.mediaDevices.removeEventListener(
                                'devicechange',
                                () => assertResolves(updateDevices())
                            );
                            listening = false;
                        }
                    };
                } else {
                    setPreview(undefined);
                    return () => {};
                }
            },
        });
        return () => {
            unsubscribeUserMedia();
        };
    });

    return (
        <div class="UserMediaPicker">
            <div class="UserMediaPicker_previewUserMedia">
                <video
                    attr:playsinline
                    attr:controlslist="nodownload nofullscreen noremoteplayback"
                    class="UserMediaPicker_previewUserVideo"
                    ref={videoRef}
                />
                <audio
                    attr:controlslist="nodownload nofullscreen noremoteplayback"
                    class="UserMediaPicker_previewUserAudio"
                    ref={audioRef}
                />
                <meter
                    class="UserMediaPicker_previewUserAudioGain"
                    value={gainValue}
                    min={0}
                    max={1}
                />
            </div>
            <div class="UserMediaPicker_share">
                <Checkbox
                    checked={isSharingUserMedia}
                    status={calc(() =>
                        isSharingUserMedia.get() ? 'success' : 'info'
                    )}
                    on:input={(e, el) => isSharingUserMedia.set(el.checked)}
                >
                    Share camera/microphone
                </Checkbox>
            </div>
            {calc(
                () =>
                    isSharingUserMedia.get() && (
                        <>
                            <div class="UserMediaPicker_videoInput">
                                <p>Video devices:</p>
                                <Checkbox
                                    type="radio"
                                    name={`${id}_videoInput`}
                                    value="none"
                                    checked={calc(
                                        () => isSharingUserVideo.get() === false
                                    )}
                                    on:input={(e, el) => {
                                        if (el.checked) {
                                            isSharingUserVideo.set(false);
                                        }
                                    }}
                                >
                                    No video
                                </Checkbox>
                                {userMediaDevices.mapView((userMediaDevice) => {
                                    if (userMediaDevice.kind !== 'videoinput')
                                        return null;
                                    return (
                                        <Checkbox
                                            type="radio"
                                            name={`${id}_videoInput`}
                                            value={userMediaDevice.deviceId}
                                            checked={calc(
                                                () =>
                                                    isSharingUserVideo.get() &&
                                                    previewUserMedia
                                                        .get()
                                                        ?.getVideoTracks()
                                                        .some(
                                                            (track) =>
                                                                track.getCapabilities()
                                                                    .deviceId ===
                                                                userMediaDevice.deviceId
                                                        )
                                            )}
                                            on:input={(e, el) => {
                                                if (el.checked) {
                                                    isSharingUserVideo.set(
                                                        true
                                                    );
                                                    videoInputPreferences.deviceId =
                                                        userMediaDevice.deviceId;
                                                }
                                            }}
                                        >
                                            {userMediaDevice.label}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                            <div class="UserMediaPicker_audioInput">
                                <p>Audio devices:</p>
                                <Checkbox
                                    type="radio"
                                    name={`${id}_audioInput`}
                                    value="none"
                                    checked={calc(
                                        () => isSharingUserAudio.get() === false
                                    )}
                                    on:input={(e, el) => {
                                        if (el.checked) {
                                            isSharingUserAudio.set(false);
                                        }
                                    }}
                                >
                                    No audio
                                </Checkbox>
                                {userMediaDevices.mapView((userMediaDevice) => {
                                    if (userMediaDevice.kind !== 'audioinput')
                                        return null;
                                    return (
                                        <Checkbox
                                            type="radio"
                                            name={`${id}_audioInput`}
                                            value={userMediaDevice.deviceId}
                                            checked={calc(
                                                () =>
                                                    isSharingUserAudio.get() &&
                                                    previewUserMedia
                                                        .get()
                                                        ?.getAudioTracks()
                                                        .some(
                                                            (track) =>
                                                                track.getCapabilities()
                                                                    .deviceId ===
                                                                userMediaDevice.deviceId
                                                        )
                                            )}
                                            on:input={(e, el) => {
                                                if (el.checked) {
                                                    isSharingUserAudio.set(
                                                        true
                                                    );
                                                    audioInputPreferences.deviceId =
                                                        userMediaDevice.deviceId;
                                                }
                                            }}
                                        >
                                            {userMediaDevice.label}
                                        </Checkbox>
                                    );
                                })}
                            </div>
                        </>
                    )
            )}
        </div>
    );
};
