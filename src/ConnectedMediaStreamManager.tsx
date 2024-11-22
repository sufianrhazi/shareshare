import Gooey from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Checkbox } from './Checkbox';
import type { DynamicMediaStream } from './DynamicMediaStream';

import './ConnectedMediaStreamManager.css';

export const ConnectedMediaStreamManager: Component<{
    dynamicMediaStream: DynamicMediaStream;
}> = ({ dynamicMediaStream }) => {
    return (
        <div class="ConnectedMediaStreamManager">
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
