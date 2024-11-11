import Gooey, { calc, collection, field, model, ref } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { calc2 } from './calc2';
import { mkid } from './mkid';

import './MediaPicker.css';

const newId = mkid('MediaPicker');

// Note: these live as global values, you either are sharing user media/displays or you aren't
const isSharingUserMedia = field(false);
const isSharingDisplay = field(false);

const activeDisplay = field<null | MediaStream>(null);
const activeUserMedia = field<null | MediaStream>(null);
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

export const MediaPicker: Component = (props, { onMount }) => {
    const id = newId();

    const videoRef = ref<HTMLVideoElement>();
    const audioRef = ref<HTMLAudioElement>();
    const gainValue = field(0);

    onMount(() => {
        /*
        const updateDisplays = () => {
            navigator.mediaDevices
                .getDisplayMedia({
                    video: true,
                    audio: true,
                })
                .then((display) => {
                    activeDisplay.set(display);
                });
        };
        */

        const unsubscribeUserMedia = calc2({
            cleanup: (result) => result(),
            fn: () => {
                let cancelled = false;
                let listening = false;
                let onFrameHandle: number | undefined;
                const sharingUserMedia = isSharingUserMedia.get();
                const sharingUserVideo = isSharingUserVideo.get();
                const sharingUserAudio = isSharingUserAudio.get();
                if (sharingUserMedia) {
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
                            activeUserMedia.set(media);
                            const audioContext = new AudioContext();
                            const mediaStreamAudioSourceNode: AudioNode =
                                audioContext.createMediaStreamSource(media);
                            const analyserNode = audioContext.createAnalyser();
                            mediaStreamAudioSourceNode.connect(analyserNode);

                            const pcmData = new Float32Array(
                                analyserNode.fftSize
                            );
                            const onFrame = () => {
                                analyserNode.getFloatTimeDomainData(pcmData);
                                let sumSquares = 0.0;
                                for (const amplitude of pcmData) {
                                    sumSquares += amplitude * amplitude;
                                }
                                gainValue.set(
                                    Math.sqrt(sumSquares / pcmData.length)
                                );
                                onFrameHandle =
                                    window.requestAnimationFrame(onFrame);
                            };
                            onFrameHandle =
                                window.requestAnimationFrame(onFrame);
                            if (videoRef.current) {
                                videoRef.current.srcObject = media;
                                videoRef.current.play();
                            }
                            if (audioRef.current) {
                                audioRef.current.srcObject = media;
                                audioRef.current.play();
                            }
                            navigator.mediaDevices.addEventListener(
                                'devicechange',
                                updateDevices
                            );
                            listening = true;
                            return updateDevices();
                        });
                    return () => {
                        cancelled = true;
                        if (onFrameHandle) {
                            window.cancelAnimationFrame(onFrameHandle);
                        }
                        if (listening) {
                            navigator.mediaDevices.removeEventListener(
                                'devicechange',
                                updateDevices
                            );
                            listening = false;
                        }
                    };
                } else {
                    activeUserMedia.set(null);
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                        videoRef.current.pause();
                    }
                    if (audioRef.current) {
                        audioRef.current.srcObject = null;
                        audioRef.current.pause();
                    }
                    return () => {};
                }
            },
        });
        /*
        const unsubscribeDisplay = isSharingDisplay.subscribe(
            (err, sharingDisplay) => {
                if (sharingDisplay) {
                    updateDisplays();
                }
            }
        );
        */
        return () => {
            /*
            unsubscribeDisplay();
            */
            unsubscribeUserMedia();
        };
    });

    return (
        <div class="MediaPicker">
            <div class="MediaPicker_previewUserMedia">
                <video class="MediaPicker_previewUserVideo" ref={videoRef} />
                <audio class="MediaPicker_previewUserAudio" ref={audioRef} />
                <meter value={gainValue} min={0} max={1} />
            </div>
            <div class="MediaPicker_share">
                <label>
                    <input
                        type="checkbox"
                        checked={isSharingUserMedia}
                        on:input={(e, el) => isSharingUserMedia.set(el.checked)}
                    />{' '}
                    Share camera/microphone
                </label>
            </div>
            {calc(
                () =>
                    isSharingUserMedia.get() && (
                        <>
                            <div class="MediaPicker_videoInput">
                                <p>Video devices:</p>
                                <label>
                                    <input
                                        type="radio"
                                        name={`${id}_videoInput`}
                                        value="none"
                                        checked={calc(
                                            () =>
                                                isSharingUserVideo.get() ===
                                                false
                                        )}
                                        on:input={(e, el) => {
                                            if (el.checked) {
                                                isSharingUserVideo.set(false);
                                            }
                                        }}
                                    />{' '}
                                    Do not share video
                                </label>
                                {userMediaDevices.mapView((userMediaDevice) => {
                                    if (userMediaDevice.kind !== 'videoinput')
                                        return null;
                                    return (
                                        <label>
                                            <input
                                                type="radio"
                                                name={`${id}_videoInput`}
                                                value={userMediaDevice.deviceId}
                                                checked={calc(
                                                    () =>
                                                        isSharingUserVideo.get() &&
                                                        userMediaDevice.deviceId ===
                                                            videoInputPreferences.deviceId
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
                                            />{' '}
                                            {userMediaDevice.label}
                                        </label>
                                    );
                                })}
                            </div>
                            <div class="MediaPicker_audioInput">
                                <p>Audio devices:</p>
                                <label>
                                    <input
                                        type="radio"
                                        name={`${id}_audioInput`}
                                        value="none"
                                        checked={calc(
                                            () =>
                                                isSharingUserAudio.get() ===
                                                false
                                        )}
                                        on:input={(e, el) => {
                                            if (el.checked) {
                                                isSharingUserAudio.set(false);
                                            }
                                        }}
                                    />{' '}
                                    Do not share video
                                </label>
                                {userMediaDevices.mapView((userMediaDevice) => {
                                    if (userMediaDevice.kind !== 'audioinput')
                                        return null;
                                    return (
                                        <label>
                                            <input
                                                type="radio"
                                                name={`${id}_audioInput`}
                                                value={userMediaDevice.deviceId}
                                                checked={calc(
                                                    () =>
                                                        isSharingUserAudio.get() &&
                                                        userMediaDevice.deviceId ===
                                                            audioInputPreferences.deviceId
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
                                            />{' '}
                                            {userMediaDevice.label}
                                        </label>
                                    );
                                })}
                            </div>
                            {calc(() => {
                                const userMedia = activeUserMedia.get();
                                if (!userMedia) {
                                    return null;
                                }
                                return userMedia.getTracks().map((track) => {
                                    const capabilities =
                                        track.getCapabilities();
                                    const capabilityInputs: JSX.Node[] = [];
                                    if (
                                        capabilities.aspectRatio &&
                                        capabilities.aspectRatio.max !==
                                            undefined &&
                                        capabilities.aspectRatio.min !==
                                            undefined
                                    ) {
                                        capabilityInputs.push(
                                            <label>
                                                Aspect ratio:{' '}
                                                <input
                                                    type="range"
                                                    min={
                                                        capabilities.aspectRatio
                                                            .min
                                                    }
                                                    max={
                                                        capabilities.aspectRatio
                                                            .max
                                                    }
                                                />
                                            </label>
                                        );
                                    }
                                    if (
                                        capabilities.autoGainControl &&
                                        capabilities.autoGainControl.length > 1
                                    ) {
                                        capabilityInputs.push(
                                            <label>
                                                <input type="checkbox" /> Auto
                                                Gain Control
                                            </label>
                                        );
                                    }
                                    if (capabilities.facingMode) {
                                        capabilityInputs.push(
                                            <label>
                                                Facing mode:{' '}
                                                <select>
                                                    {capabilities.facingMode.map(
                                                        (facingMode) => (
                                                            <option
                                                                value={
                                                                    facingMode
                                                                }
                                                            >
                                                                {facingMode}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </label>
                                        );
                                    }
                                    return (
                                        <>
                                            <p>
                                                <b>
                                                    Device: {track.label} (
                                                    {track.kind})
                                                </b>
                                            </p>
                                            {capabilityInputs}
                                        </>
                                    );
                                });
                            })}
                        </>
                    )
            )}
        </div>
    );
};
