import { WebhookClient } from "discord.js";
import { IWallPostContextPayload } from "vk-io";

import { Message } from "./Message.js";
import { Keywords } from "./Keywords.js";

import { db } from "./DB.js";

export class Sender extends Message {

    private postDate = 0;

    async handle(payload: IWallPostContextPayload): Promise<void> {
        const { index, vk: { longpoll, filter, group_id, keywords, ads, donut, words_blacklist } } = this.cluster;

        this.postDate = payload.date as number;

        const cache = await db.get(group_id)
            .value();

        if (
            cache?.last !== payload.date &&
            !cache?.published?.includes(payload.date as number)
        ) {
            if (
                new Keywords({
                    type: "keywords",
                    keywords
                })
                    .check(payload.text) &&
                new Keywords({
                    type: "blacklist",
                    keywords: words_blacklist
                })
                    .check(payload.text)
            ) {
                if (
                    (longpoll && filter && payload.owner_id !== payload.from_id) || // Фильтр на записи "Только от имени группы" для LongPoll API
                    (!ads && payload.marked_as_ads) || // @ts-ignore Invalid lib type
                    (!donut && payload.donut.is_donut)
                ) {
                    return console.log(`[!] Новая запись в кластере #${index} не соответствует настройкам конфига, игнорируем ее.`);
                }

                await this.parsePost(payload);

                return this.send();
            }

            return console.log(`[!] Новая запись в кластере #${index} не соответствует ключевым словам, игнорируем ее.`);
        }

        return console.log(`[!] Новых записей в кластере #${index} нет.`);
    }

    private async send(): Promise<void> {
        const { post, repost, builders: [builder], cluster: { index, discord: { webhook_urls, content, username, avatar_url: avatarURL } } } = this;

        builder.setDescription(post + repost);

        await this.pushDate(); // Сохраняем дату поста, чтобы не публиковать его заново

        await Promise.allSettled(
            webhook_urls.map((url, webhookIndex) => {
                const isWebHookUrl = /https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/([^]+)\/([^/]+)/g.exec(url);

                if (isWebHookUrl) {
                    const [, id, token] = isWebHookUrl;

                    return new WebhookClient(id, token)
                        .send({ // @ts-ignore Отсутствует тип в самой библиотеке
                            content,
                            embeds: this.builders,
                            username: username.slice(0, 80),
                            avatarURL
                        });
                } else {
                    throw `[!] Строка #${webhookIndex + 1} (${url}) в кластере #${index} не является ссылкой на Discord Webhook.`;
                }
            })
        )
            .then((outputs) => {
                const rejects = outputs.filter(({ status }) => status === "rejected") as PromiseRejectedResult[];

                if (rejects.length) {
                    return rejects.forEach(({ reason }) => {
                        console.error(`[!] Произошла ошибка при отправке сообщения в кластере #${index}:`);
                        console.error(reason);
                    });
                }

                console.log(`[VK2Discord] Запись в кластере #${index} опубликована.`);
            });
    }

    private async pushDate(): Promise<void> {
        const { cluster: { vk: { group_id } }, postDate } = this;

        if (db.has(group_id).value()) {
            await db.set(`${group_id}.last`, postDate)
                .update(`${group_id}.published`, (published) => [postDate, ...published].splice(0, 50))
                .write();
        } else {
            await db.set(group_id, {
                last: postDate,
                published: [
                    postDate
                ]
            })
                .write();
        }
    }
}
