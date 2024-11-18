import Gooey, { field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Tabs } from './Tabs';
import { UserMediaPicker } from './UserMediaPicker';

import './MediaPicker.css';

type MediaPickerTab = 'camera' | 'file' | 'user';

export const MediaPicker: Component<{
    setUserMedia: (mediaStream: MediaStream | undefined) => void;
}> = ({ setUserMedia }, { onMount, onUnmount }) => {
    const activeTab = field<MediaPickerTab>('camera');

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
                    content: () => <p>Coming soon...</p>,
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
