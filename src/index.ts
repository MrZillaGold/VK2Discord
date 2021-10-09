import { HexColorString } from 'discord.js';

import { Handler, Storage, VK } from './modules';

// @ts-ignore
import config from '../config.json';

export interface IConfig {
    clusters: ICluster[];
    version_dont_modify_me: number;
}

export interface IVKParams {
    token: string;
    group_id: string;
    keywords: string[];
    words_blacklist: string[];
    filter: boolean;
    donut: boolean;
    ads: boolean;
    longpoll: boolean;
    interval: number;
}

export interface IDiscordParams {
    webhook_urls: string[];
    username: string;
    avatar_url: string;
    content: string;
    color: HexColorString;
    author: boolean;
    copyright: boolean;
}

export interface ICluster {
    vk: IVKParams;
    discord: IDiscordParams;

    VK: VK;
    storage: Storage;
    index: number;
}

const { clusters } = config as unknown as IConfig;

console.log('[VK2Discord] Запущен.');

const handlers = await Promise.all(
    clusters.map((cluster: Pick<ICluster, 'vk' | 'discord'>, index: number) => (
        new Handler({
            ...cluster,
            index: index + 1
        })
            .init()
    ))
);

const uniqueHandlers = handlers.reduce<[Storage, ICluster['vk']['group_id'][]][]>((handlers, handler) => {
    const instanceIndex = handlers.findIndex(([{ prefix }]) => (
        prefix === handler.storage.prefix
    ));
    const hasInstance = instanceIndex !== -1;

    const handlerGroupId = handler.cluster.vk.group_id;

    if (!hasInstance) {
        handlers.push([handler.storage, [handlerGroupId]]);
    } else {
        handlers[instanceIndex][1].push(handlerGroupId);
    }

    return handlers;
}, []);

uniqueHandlers.forEach(async ([storage, groupIds]) => {
    const keys = await storage.getKeys();

    const outdatedKeys = keys.reduce<string[]>((keys, key) => {
        if (
            key.startsWith(Storage.PREFIX) &&
            groupIds.findIndex((id) => key.includes(`-${id}-`)) === -1
        ) {
            keys.push(key);
        }

        return keys;
    }, []);

    await Promise.all(
        outdatedKeys.map((key) => (
            storage.set(key)
        ))
    );
});