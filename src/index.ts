import { HexColorString } from 'discord.js';

import { Handler, VK } from './modules';

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
    index: number;
}

const { clusters } = config as unknown as IConfig;

console.log('[VK2Discord] Запущен.');

clusters.forEach((cluster: Pick<ICluster, 'vk' | 'discord'>, index: number): void => (
    new Handler({
        ...cluster,
        index: index + 1
    })
        .init()
));
