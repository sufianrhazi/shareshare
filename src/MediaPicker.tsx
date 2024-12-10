import Gooey, { field, ref } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { Tabs } from './Tabs';
import { UserMediaPicker } from './UserMediaPicker';

import './MediaPicker.css';

type MediaPickerTab = 'camera' | 'file' | 'user';

export const MediaPicker: Component<{
    setUserMedia: (mediaStream: MediaStream | undefined) => void;
    onShareFiles: (file: File[]) => void;
}> = ({ setUserMedia, onShareFiles }, { onMount, onUnmount }) => {
    const activeTab = field<MediaPickerTab>('camera');

    const inputRef = ref<HTMLInputElement>();

    return (
        <Tabs
            active={activeTab}
            tabs={[
                {
                    tab: 'camera',
                    label: 'Share Camera',
                    content: () => (
                        <UserMediaPicker setUserMedia={setUserMedia} />
                    ),
                },
                {
                    tab: 'file',
                    label: 'Share File',
                    content: () => (
                        <div>
                            <label>
                                <input
                                    required
                                    ref={inputRef}
                                    name="files"
                                    type="file"
                                    multiple
                                />
                            </label>
                            <Button
                                primary
                                on:click={(e, el) => {
                                    e.preventDefault();
                                    if (!inputRef.current) {
                                        return;
                                    }
                                    const files = Array.from(
                                        inputRef.current.files || []
                                    );
                                    if (files.length > 0) {
                                        onShareFiles(files);
                                    }
                                }}
                            >
                                Share
                            </Button>
                        </div>
                    ),
                },
                {
                    tab: 'user',
                    label: 'Share App/Screen',
                    content: () => <p>Coming soon...</p>,
                },
            ]}
            onTabClick={(newTab) => activeTab.set(newTab)}
        />
    );
};
