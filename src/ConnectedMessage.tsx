import Gooey, { calc } from '@srhazi/gooey';
import type { Component } from '@srhazi/gooey';

import { Button } from './Button';
import { Buttons } from './Buttons';
import { classes } from './classes';
import { svc } from './svc';
import { Timestamp } from './Timestamp';
import type { LocalMessage } from './types';
import { isDirectionalMessage } from './types';
import { assert, assertExhausted } from './utils';

import './ConnectedMessage.css';

const FilePreview: Component<{
    blob: Blob;
    name: string;
    mimeType: string;
    size: number;
    showDownload?: boolean;
}> = ({ blob, name, mimeType, size, showDownload }) => {
    const url = URL.createObjectURL(blob);
    if (mimeType.startsWith('image/')) {
        return (
            <details open>
                <summary>
                    <FileToken name={name} mimeType={mimeType} size={size} />
                </summary>
                <img title={name} src={url} />
            </details>
        );
    }
    if (mimeType.startsWith('video/')) {
        return (
            <details open>
                <summary>
                    <FileToken name={name} mimeType={mimeType} size={size} />
                </summary>
                <video title={name} controls muted autoplay loop src={url}>
                    <source src={url} type={mimeType} />
                </video>
            </details>
        );
    }
    if (mimeType.startsWith('audio/')) {
        return (
            <details open>
                <summary>
                    <FileToken name={name} mimeType={mimeType} size={size} />
                </summary>
                <audio title={name} controls loop>
                    <source src={url} type={mimeType} />
                </audio>
            </details>
        );
    }
    return (
        <>
            file
            <FileToken name={name} mimeType={mimeType} size={size} />
            {showDownload && (
                <>
                    {' '}
                    <a href={url} download={name}>
                        Save
                    </a>
                </>
            )}
        </>
    );
};

const FileToken: Component<{
    name: string;
    mimeType: string;
    size: number;
}> = ({ name, mimeType, size }) => {
    return (
        <>
            <code>{name}</code> (<code>{mimeType}</code>,{' '}
            <strong>{size.toLocaleString()}</strong> bytes)
        </>
    );
};

export const ConnectedMessage: Component<{
    class?: string | undefined;
    message: LocalMessage;
    onMount?: () => void;
}> = (
    { class: className, message, onMount: onComponentMount },
    { onMount }
) => {
    if (onComponentMount) {
        onMount(onComponentMount);
    }
    let content: JSX.Node;
    switch (message.type) {
        case 'chat': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />
                    <div class="ConnectedMessage_content">
                        <strong class="ConnectedMessage_name">
                            {message.from === 'you'
                                ? svc('state').localName
                                : svc('state').peerName}
                        </strong>
                        : {message.msg}
                    </div>
                </>
            );
            break;
        }
        case 'name': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />
                    <div class="ConnectedMessage_content">
                        <strong class="ConnectedMessage_name">
                            {message.priorName}
                        </strong>{' '}
                        now goes by{' '}
                        <strong class="ConnectedMessage_name">
                            {message.name}
                        </strong>
                    </div>
                </>
            );
            break;
        }
        case 'chatstart': {
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />
                    <div class="ConnectedMessage_content">
                        You're now sharing with{' '}
                        <strong class="ConnectedMessage_name">
                            {svc('state').peerName}
                        </strong>
                    </div>
                </>
            );
            break;
        }
        case 'disconnected': {
            content = (
                <>
                    <Timestamp class="ConnectedMessage_ts" time={Date.now()} />
                    <div class="ConnectedMessage_content">
                        You are no longer connected.
                    </div>
                </>
            );
            break;
        }
        case 'file_recv': {
            const fileState = svc('state').getReceivedFileState(message.id);
            if (!fileState) {
                return (
                    <>
                        <Timestamp
                            class="ConnectedMessage_ts"
                            time={message.sent}
                        />
                        <div class="ConnectedMessage_content">
                            <strong class="ConnectedMessage_name">
                                {svc('state').peerName}
                            </strong>{' '}
                            tried to send a file, but something went wrong.
                        </div>
                    </>
                );
            }
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />
                    <div class="ConnectedMessage_content">
                        {calc(() => {
                            const status = fileState.status.get();
                            switch (status) {
                                case 'requested':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>{' '}
                                            wants to send a file:{' '}
                                            <FileToken
                                                name={fileState.name}
                                                mimeType={fileState.mimeType}
                                                size={fileState.size}
                                            />{' '}
                                            <Buttons>
                                                <Button
                                                    primary
                                                    size="xs"
                                                    on:click={() =>
                                                        svc('state').acceptFile(
                                                            fileState.id
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    primary
                                                    size="xs"
                                                    on:click={() =>
                                                        svc('state').rejectFile(
                                                            fileState.id
                                                        )
                                                    }
                                                >
                                                    Decline
                                                </Button>
                                            </Buttons>
                                        </>
                                    );
                                case 'rejected':
                                    return (
                                        <>
                                            You declined the file{' '}
                                            <FileToken
                                                name={fileState.name}
                                                mimeType={fileState.mimeType}
                                                size={fileState.size}
                                            />{' '}
                                            from{' '}
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>
                                            .
                                        </>
                                    );
                                case 'receiving':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>{' '}
                                            sending file{' '}
                                            <FileToken
                                                name={fileState.name}
                                                mimeType={fileState.mimeType}
                                                size={fileState.size}
                                            />
                                            <meter
                                                min="0"
                                                max="100"
                                                value={calc(
                                                    () =>
                                                        (100 *
                                                            fileState.lastOffset.get()) /
                                                        fileState.size
                                                )}
                                            />
                                            <Button
                                                size="xs"
                                                on:click={() =>
                                                    svc('state').rejectFile(
                                                        fileState.id
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    );
                                case 'received':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>{' '}
                                            sent{' '}
                                            {calc(() => {
                                                const contents =
                                                    fileState.contents.get();
                                                assert(
                                                    contents,
                                                    'Received file does not have contents!'
                                                );
                                                const blob = new Blob(
                                                    [contents],
                                                    {
                                                        type: fileState.mimeType,
                                                    }
                                                );
                                                return (
                                                    <FilePreview
                                                        blob={blob}
                                                        name={fileState.name}
                                                        mimeType={
                                                            fileState.mimeType
                                                        }
                                                        size={fileState.size}
                                                        showDownload
                                                    />
                                                );
                                            })}
                                        </>
                                    );
                                case 'cancelled':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>{' '}
                                            cancelled sending the file{' '}
                                            <FileToken
                                                name={fileState.name}
                                                mimeType={fileState.mimeType}
                                                size={fileState.size}
                                            />
                                            .
                                        </>
                                    );
                                case 'accepted':
                                    return (
                                        <>
                                            You accepted the file{' '}
                                            <FileToken
                                                name={fileState.name}
                                                mimeType={fileState.mimeType}
                                                size={fileState.size}
                                            />{' '}
                                            from{' '}
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').peerName}
                                            </strong>
                                            . Waiting for transfer to start...
                                        </>
                                    );
                                default:
                                    assertExhausted(status);
                            }
                        })}
                    </div>
                </>
            );
            break;
        }
        case 'file_send': {
            const fileState = svc('state').getSentFileState(message.id);
            if (!fileState) {
                return (
                    <>
                        <Timestamp
                            class="ConnectedMessage_ts"
                            time={message.sent}
                        />
                        <div class="ConnectedMessage_content">
                            <strong class="ConnectedMessage_name">
                                {svc('state').localName}
                            </strong>{' '}
                            tried to send a file, but something went wrong.
                        </div>
                    </>
                );
            }
            content = (
                <>
                    <Timestamp
                        class="ConnectedMessage_ts"
                        time={message.sent}
                    />
                    <div class="ConnectedMessage_content">
                        {calc(() => {
                            const status = fileState.status.get();
                            switch (status) {
                                case 'requested':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            requesting file send…
                                            <Button
                                                size="xs"
                                                on:click={() =>
                                                    svc('state').cancelFile(
                                                        fileState.id
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    );
                                case 'rejected':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            file send declined
                                            <FileToken
                                                name={fileState.file.name}
                                                mimeType={fileState.file.type}
                                                size={fileState.file.size}
                                            />
                                        </>
                                    );
                                case 'sending':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            sending file
                                            <FileToken
                                                name={fileState.file.name}
                                                mimeType={fileState.file.type}
                                                size={fileState.file.size}
                                            />
                                            <meter
                                                min="0"
                                                max="100"
                                                value={calc(
                                                    () =>
                                                        (100 *
                                                            fileState.sendOffset.get()) /
                                                        fileState.file.size
                                                )}
                                            />
                                            <Button
                                                size="xs"
                                                on:click={() =>
                                                    svc('state').cancelFile(
                                                        fileState.id
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    );
                                case 'sent':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            sent{' '}
                                            <FilePreview
                                                blob={fileState.file}
                                                name={fileState.file.name}
                                                mimeType={fileState.file.type}
                                                size={fileState.file.size}
                                            />
                                        </>
                                    );
                                case 'cancelled':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            cancelled sending{' '}
                                            <FileToken
                                                name={fileState.file.name}
                                                mimeType={fileState.file.type}
                                                size={fileState.file.size}
                                            />
                                        </>
                                    );
                                case 'accepted':
                                    return (
                                        <>
                                            <strong class="ConnectedMessage_name">
                                                {svc('state').localName}
                                            </strong>{' '}
                                            sending file
                                            <FileToken
                                                name={fileState.file.name}
                                                mimeType={fileState.file.type}
                                                size={fileState.file.size}
                                            />
                                            …
                                        </>
                                    );
                                default:
                                    assertExhausted(status);
                            }
                        })}
                    </div>
                </>
            );
            break;
        }
        default:
            assertExhausted(message);
    }
    return (
        <li
            class={classes('ConnectedMessage', {
                'ConnectedMessage-in':
                    isDirectionalMessage(message) && message.from === 'peer',
                'ConnectedMessage-out':
                    isDirectionalMessage(message) && message.from === 'you',
                'ConnectedMessage-info': message.type !== 'chat',
            })}
        >
            {content}
        </li>
    );
};
