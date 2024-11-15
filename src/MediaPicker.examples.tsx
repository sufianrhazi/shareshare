import Gooey, { calc, field, mount } from '@srhazi/gooey';

import { Example } from './Example';
import { MediaPicker } from './MediaPicker';
import { assertResolves } from './utils';

import './ChatMain.scss';

const userMedia = field<MediaStream | undefined>(undefined);

mount(
    document.body,
    <>
        <Example title="Media Picker">
            <MediaPicker
                setUserMedia={(mediaStream) => userMedia.set(mediaStream)}
            />
        </Example>
        {calc(() => {
            const mediaStream = userMedia.get();
            if (!mediaStream) {
                return null;
            }
            const volume = field(0);
            return (
                <Example title={`Stream: ${mediaStream.id}`}>
                    <video
                        ref={(videoEl) => {
                            if (videoEl) {
                                videoEl.srcObject = mediaStream;
                                assertResolves(videoEl.play());
                            }
                        }}
                    />
                    <audio
                        attr:volume={volume}
                        ref={(audioEl) => {
                            if (audioEl) {
                                audioEl.srcObject = mediaStream;
                                assertResolves(audioEl.play());
                            }
                        }}
                    />
                    <label>
                        Volume:{' '}
                        <input
                            type="range"
                            value={volume}
                            min="0"
                            max="1"
                            step="0.01"
                            on:input={(e, el) => {
                                volume.set(el.valueAsNumber);
                            }}
                        />
                    </label>
                </Example>
            );
        })}
    </>
);
