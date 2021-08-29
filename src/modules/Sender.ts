import { WebhookClient } from 'discord.js';
import { IWallPostContextPayload } from 'vk-io';

import { db, DBSchema, Message, Keywords, KeywordsType } from './';

import { ICluster } from '../';

export class Sender extends Message {

    readonly payload: Message['payload'];

    constructor(cluster: ICluster, payload: IWallPostContextPayload) {
        super(cluster);

        this.payload = payload;
    }

    async handle(): Promise<void> {
        const { index, vk: { longpoll, filter, group_id, keywords, ads, donut: donutStatus, words_blacklist } } = this.cluster;
        const { date, owner_id, from_id, marked_as_ads, donut, text } = this.payload;

        const cache = (db.data as DBSchema)[group_id];
        const hasInCache = cache?.last === date || cache?.published?.includes(date as number);

        if (hasInCache) {
            return console.log(`[!] Новых записей в кластере #${index} нет.`);
        }

        const isNotFromGroupName = longpoll && filter && owner_id !== from_id;
        const hasAds = !ads && marked_as_ads;
        const hasDonut = !donutStatus && donut?.is_donut;

        if (isNotFromGroupName || hasAds || hasDonut) {
            return console.log(`[!] Новая запись в кластере #${index} не соответствует настройкам конфигурации, игнорируем ее.`);
        }

        const hasKeywords = new Keywords({
            type: KeywordsType.KEYWORDS,
            keywords
        })
            .check(text);

        const notHasBlacklistWords = new Keywords({
            type: KeywordsType.BLACKLIST,
            keywords: words_blacklist
        })
            .check(text);

        if (hasKeywords && notHasBlacklistWords) {
            await this.parsePost();

            return this.send();
        }

        return console.log(`[!] Новая запись в кластере #${index} не соответствует ключевым словам, игнорируем ее.`);
    }

    private async send(): Promise<void> {
        const { post, repost, embeds: [embed], cluster: { index, discord: { webhook_urls, content, username, avatar_url: avatarURL } } } = this;

        embed.setDescription(post + repost);

        await this.pushDate();

        const results = await Promise.allSettled(
            webhook_urls.map((url) => (
                new WebhookClient({
                    url
                })
                    .send({
                        content: content || null,
                        avatarURL,
                        embeds: this.embeds,
                        files: this.files,
                        username: username.slice(0, 80)
                    })
            ))
        );

        const rejects = results.filter(({ status }) => status === 'rejected') as PromiseRejectedResult[];

        if (rejects.length) {
            return rejects.forEach(({ reason }) => {
                console.error(`[!] Произошла ошибка при отправке сообщения в кластере #${index}:`);
                console.error(reason);
            });
        }

        console.log(`[VK2Discord] Запись в кластере #${index} опубликована.`);
    }

    private async pushDate(): Promise<void> {
        const { cluster: { vk: { group_id } }, payload: { date } } = this;

        if (!(db.data as DBSchema)[group_id]) {
            (db.data as DBSchema)[group_id] = {};
        }

        const cache = (db.data as DBSchema)[group_id];

        cache.last = date;
        cache.published = [date as number, ...(cache.published || [])].splice(0, 50);

        await db.write();
    }
}
