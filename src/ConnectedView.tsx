import Gooey, { calc, collection, field } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedMedia } from './ConnectedMedia';
import { ConnectedMessages } from './ConnectedMessages';
import { DynamicMediaStreams } from './DynamicMediaStreams';
import { svc } from './svc';
import {
    isWireChatMessage,
    isWireRenameMessage,
    isWireSendFile,
} from './types';
import type { LocalMessage, WireDataMessage } from './types';

import './ConnectedView.css';

export const ConnectedView: Component = () => {
    const isConnected = calc(() => {
        const state = svc('state').getState();
        return state.type === 'connected' && state.connected;
    });
    const chatMessages = collection<LocalMessage>([
        {
            type: 'chatstart',
            from: 'peer',
            sent: Date.now(),
        },
    ]);

    const dynamicMediaStreams = new DynamicMediaStreams();

    let userMediaStream: MediaStream | undefined;

    const localName = field('You');
    const peerName = field('Friend');
    svc('peer').onMessage((message) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(message);
        } catch {
            return;
        }
        if (isWireRenameMessage(parsed)) {
            const priorName = peerName.get();
            peerName.set(parsed.name);
            chatMessages.push({
                type: 'name',
                from: 'peer',
                sent: parsed.sent,
                priorName,
                name: parsed.name,
            });
        }
        if (isWireChatMessage(parsed)) {
            chatMessages.push({
                type: 'chat',
                from: 'peer',
                sent: parsed.sent,
                msg: parsed.msg,
            });
        }
        if (isWireSendFile(parsed)) {
            chatMessages.push({
                type: 'file',
                from: 'peer',
                sent: parsed.sent,
                fileName: parsed.fileName,
                length: parsed.length,
                content: parsed.content,
            });
        }
    });
    svc('peer').onTrack((track, streams, tranceiver) => {
        for (const stream of streams) {
            dynamicMediaStreams.addStream({
                mediaStream: stream,
                tranceiver,
                isLocal: false,
            });
        }
    });

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
            <ConnectedMedia
                class="ConnectedView_media"
                dynamicMediaStreams={dynamicMediaStreams}
            />
            <ConnectedMessages
                class="ConnectedView_messages"
                isConnected={isConnected}
                localName={localName}
                peerName={peerName}
                chatMessages={chatMessages}
            />
            <ConnectedControls
                class="ConnectedView_controls"
                isConnected={isConnected}
                localName={localName}
                peerName={peerName}
                onRename={(newName) => {
                    const priorName = localName.get();
                    localName.set(newName);
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
                    chatMessages.push(localMessage);
                    svc('peer').send(JSON.stringify(wireMessage));
                }}
                onShareUserMedia={(mediaStream) => {
                    if (userMediaStream) {
                        // TODO: tell the peer that this stream is going away
                        dynamicMediaStreams.removeStream(userMediaStream);
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
                        dynamicMediaStreams.addStream({
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
                    chatMessages.push(localMessage);
                    svc('peer').send(JSON.stringify(wireMessage));
                }}
            />
        </div>
    );
};
