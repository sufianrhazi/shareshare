import type { Collection, Field } from '@srhazi/gooey';
import Gooey, { calc, collection, field } from '@srhazi/gooey';

import { isEither, isExact, isShape, isString } from './shape';

const nowSeconds = field(Date.now());
setInterval(() => {
    nowSeconds.set(Date.now());
}, 1000);

const isDirectPayload = (uuid: string) =>
    isEither(
        isShape({
            toId: isExact(uuid),
            type: isExact('greetingResponse'),
            role: isString,
        }),
        isShape({
            toId: isExact(uuid),
            type: isExact('ping'),
        }),
        isShape({
            toId: isExact(uuid),
            type: isExact('pong'),
        }),
        isShape({
            toId: isExact(uuid),
            type: isExact('acceptMessage'),
            message: isString,
        })
    );

const isBroadcastMessage = (uuid: string) =>
    isEither(
        isShape({
            fromId: isString,
            payload: isShape({
                type: isExact('greeting'),
                role: isString,
            }),
        }),
        isShape({
            fromId: isString,
            payload: isDirectPayload(uuid),
        })
    );

type BroadcastMessage =
    ReturnType<typeof isBroadcastMessage> extends (
        val: unknown
    ) => val is infer T
        ? T
        : never;

export class BroadcastManager {
    private role: string;
    private fromId: string;
    private lastPing: Field<number>;
    public localTabs: Collection<{
        otherId: string;
        role: string;
        lastPing: Field<number>;
    }>;
    private broadcastChannel: BroadcastChannel;
    private onAcceptHandlers: Set<(msg: string) => void>;

    constructor(role: string) {
        this.role = role;
        this.fromId = crypto.randomUUID();
        this.lastPing = field(0);
        this.localTabs = collection([]);
        this.broadcastChannel = new BroadcastChannel('BroadcastManager');
        this.onAcceptHandlers = new Set();

        const isValidMessage = isBroadcastMessage(this.fromId);
        this.broadcastChannel.addEventListener('message', (e) => {
            if (isValidMessage(e.data)) {
                this.handleMessage(e.data);
            }
        });

        this.postMessage({
            type: 'greeting',
            role,
        });
        this.poll();
    }

    onAccept(handler: (msg: string) => void) {
        this.onAcceptHandlers.add(handler);
        return () => {
            this.onAcceptHandlers.delete(handler);
        };
    }

    render() {
        return (
            <div>
                <h3>Local Tabs</h3>
                <ul>
                    {this.localTabs.mapView((localTab) => (
                        <li>
                            {localTab.role} (uuid:{localTab.otherId}) - (
                            {calc(() => {
                                const secondsAgo =
                                    nowSeconds.get() - localTab.lastPing.get();
                                if (secondsAgo < 2000) {
                                    return 'live';
                                }
                                if (secondsAgo < 4000) {
                                    return 'stale';
                                }
                                return 'likely dead';
                            })}
                            )
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    private poll() {
        setTimeout(
            () => {
                const now = Date.now();
                this.lastPing.set(now);
                // Remove local tabs if we haven't heard from them in >5s
                this.localTabs.reject((localTab) => {
                    return now - localTab.lastPing.get() > 5000;
                });
                // Send a ping every 1s
                this.localTabs.forEach((localTab) => {
                    if (now - localTab.lastPing.get() > 1000) {
                        this.postMessage({
                            toId: localTab.otherId,
                            type: 'ping',
                        });
                    }
                });
                this.poll();
            },
            500 + Math.random() * 500
        );
    }

    postMessage(payload: BroadcastMessage['payload']) {
        this.broadcastChannel.postMessage({
            fromId: this.fromId,
            payload,
        });
    }

    private handleMessage(message: BroadcastMessage) {
        switch (message.payload.type) {
            case 'acceptMessage':
                for (const handler of this.onAcceptHandlers) {
                    handler(message.payload.message);
                }
                break;
            case 'greeting':
                this.postMessage({
                    toId: message.fromId,
                    type: 'greetingResponse',
                    role: this.role,
                });
                this.localTabs.push({
                    otherId: message.fromId,
                    role: message.payload.role,
                    lastPing: field(Date.now()),
                });
                break;
            case 'greetingResponse':
                this.localTabs.push({
                    otherId: message.fromId,
                    role: message.payload.role,
                    lastPing: field(Date.now()),
                });
                break;
            case 'ping':
                this.postMessage({
                    toId: message.fromId,
                    type: 'pong',
                });
                break;
            case 'pong': {
                const localTab = this.localTabs.find(
                    (localTab) => localTab.otherId === message.fromId
                );
                if (localTab) {
                    localTab.lastPing.set(Date.now());
                }
                break;
            }
        }
    }
}
