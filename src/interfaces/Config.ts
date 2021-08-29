import { HexColorString } from 'discord.js';

import { VK } from '../modules/VK';

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
