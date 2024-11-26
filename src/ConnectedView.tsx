import Gooey, { calc, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedMedia } from './ConnectedMedia';
import { ConnectedMessages } from './ConnectedMessages';
import { svc } from './svc';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component = () => {
    const isConnected = calc(() => {
        const state = svc('state').getState();
        return state.type === 'connected' && state.connected;
    });

    let userMediaStream: MediaStream | undefined;

    const isDraggingFile = field(false);
    const onDragOver = (e: DragEvent) => {
        if (e.dataTransfer) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            e.dataTransfer.effectAllowed = 'copy';
            isDraggingFile.set(true);
        }
    };
    const onDragLeave = (e: DragEvent) => {
        isDraggingFile.set(false);
    };

    const onDrop = (e: DragEvent) => {
        if (e.dataTransfer) {
            isDraggingFile.set(false);
            e.preventDefault();
            for (const file of Array.from(e.dataTransfer.files)) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                // TODO: send the file
                console.log('TO SEND', file);
            }
        }
    };

    return (
        <div
            on:dragenter={onDragOver}
            on:dragover={onDragOver}
            on:dragleave={onDragLeave}
            on:drop={onDrop}
            class="ConnectedView"
        >
            {calc(
                () =>
                    isDraggingFile.get() && (
                        <div class="ConnectedView_dropTarget">
                            <div>Drop to share files</div>
                        </div>
                    )
            )}
            <ConnectedMedia class="ConnectedView_media" />
            <ConnectedMessages
                class="ConnectedView_messages"
                isConnected={isConnected}
            />
            <ConnectedControls
                class="ConnectedView_controls"
                isConnected={isConnected}
                onRename={(newName) => {
                    const priorName = svc('state').localName.get();
                    svc('state').localName.set(newName);
                    const localMessage: LocalMessage = {
                        type: 'name',
                        sent: Date.now(),
                        from: 'you',
                        priorName,
                        name: newName,
                    };
                    const wireMessage: WireDataMessage = {
                        type: 'name',
                        sent: Date.now(),
                        name: newName,
                    };
                    svc('state').chatMessages.push(localMessage);
                    svc('peer').send(JSON.stringify(wireMessage));
                }}
                onShareUserMedia={(mediaStream) => {
                    if (userMediaStream) {
                        // TODO: tell the peer that this stream is going away
                        svc('state').dynamicMediaStreams.removeStream(
                            userMediaStream
                        );
                        for (const track of userMediaStream.getTracks()) {
                            track.stop();
                        }
                        userMediaStream = undefined;
                    }
                    if (mediaStream) {
                        const senders: RTCRtpSender[] = [];
                        for (const track of mediaStream.getTracks()) {
                            senders.push(
                                svc('peer').addTrack(track, mediaStream)
                            );
                        }
                        svc('state').dynamicMediaStreams.addStream({
                            mediaStream,
                            senders,
                            isLocal: true,
                        });
                        userMediaStream = mediaStream;
                    }
                }}
                onSendMessage={(msg) => {
                    const localMessage: LocalMessage = {
                        type: 'chat',
                        sent: Date.now(),
                        from: 'you',
                        msg,
                    };
                    const wireMessage: WireDataMessage = {
                        type: 'chat',
                        sent: Date.now(),
                        msg,
                    };
                    svc('state').chatMessages.push(localMessage);
                    svc('peer').send(JSON.stringify(wireMessage));
                }}
            />
        </div>
    );
};
