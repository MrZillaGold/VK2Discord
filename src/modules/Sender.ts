import { WebhookClient } from "discord.js";
import { IWallPostContextPayload } from "vk-io";

import { Message } from "./Message.js";
import { Keywords } from "./Keywords.js";

import { db } from "./DB.js";
import { WEBHOOK_REGEXP } from "./functions.js";

import { DBSchema } from "../interfaces";

export class Sender extends Message {

    private postDate = 0;

    async handle(payload: IWallPostContextPayload): Promise<void> {
        const { index, vk: { longpoll, filter, group_id, keywords, ads, donut, words_blacklist } } = this.cluster;

        this.postDate = payload.date as number;

        const cache = (db.data as DBSchema)[group_id];
        const hasInCache = cache?.last === payload.date || cache?.published?.includes(payload.date as number);

        if (hasInCache) {
            return console.log(`[!] Новых записей в кластере #${index} нет.`);
        }

        const isNotFromGroupName = longpoll && filter && payload.owner_id !== payload.from_id;
        const hasAds = !ads && payload.marked_as_ads;
        const hasDonut = !donut && payload?.donut?.is_donut;

        if (isNotFromGroupName || hasAds || hasDonut) {
            return console.log(`[!] Новая запись в кластере #${index} не соответствует настройкам конфигурации, игнорируем ее.`);
        }

        const hasKeywords = new Keywords({
            type: "keywords",
            keywords
        })
            .check(payload.text);

        const notHasBlacklistWords = new Keywords({
            type: "blacklist",
            keywords: words_blacklist
        })
            .check(payload.text);

        if (hasKeywords && notHasBlacklistWords) {
            await this.parsePost(payload);

            return this.send();
        }

        return console.log(`[!] Новая запись в кластере #${index} не соответствует ключевым словам, игнорируем ее.`);
    }

    private async send(): Promise<void> {
        const { post, repost, builders: [builder], cluster: { index, discord: { webhook_urls, content, username, avatar_url: avatarURL } } } = this;

        builder.setDescription(post + repost);

        await this.pushDate(); // Сохраняем дату поста, чтобы не публиковать его заново

        const results = await Promise.allSettled(
            webhook_urls.map((url, webhookIndex) => {
                const isWebHookUrl = url.match(WEBHOOK_REGEXP);

                if (isWebHookUrl) {
                    const [, id, token] = isWebHookUrl;

                    return new WebhookClient(id, token)
                        .send({ // @ts-ignore Отсутствует тип в самой библиотеке
                            content,
                            embeds: this.builders,
                            username: username.slice(0, 80),
                            avatarURL
                        });
                }

                throw `[!] Строка #${webhookIndex + 1} (${url}) в кластере #${index} не является ссылкой на Discord Webhook.`;
            })
        );

        const rejects = results.filter(({ status }) => status === "rejected") as PromiseRejectedResult[];

        if (rejects.length) {
            return rejects.forEach(({ reason }) => {
                console.error(`[!] Произошла ошибка при отправке сообщения в кластере #${index}:`);
                console.error(reason);
            });
        }

        console.log(`[VK2Discord] Запись в кластере #${index} опубликована.`);
    }

    private async pushDate(): Promise<void> {
        const { cluster: { vk: { group_id } }, postDate } = this;

        if (!(db.data as DBSchema)[group_id]) {
            (db.data as DBSchema)[group_id] = {};
        }

        const cache = (db.data as DBSchema)[group_id];

        cache.last = postDate;
        cache.published = [postDate, ...(cache.published || [])].splice(0, 50);

        await db.write();
    }
}
