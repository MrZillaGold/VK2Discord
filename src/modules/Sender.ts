import { WebhookClient } from "discord.js";

import { db } from "./DB.js";
import { Message } from "./Message.js";
import { Keywords } from "./Keywords.js";

import { Cluster } from "../interfaces";

export class Sender extends Message {

    private postDate: number;

    constructor(cluster: Cluster) {
        super(cluster);

        this.postDate = 0;
    }

    async handle(payload: any): Promise<void> {
        const { index, vk: { longpoll, filter, group_id, keywords, ads, donut, words_blacklist } } = this.cluster;

        const news = await db.get(group_id)
            .value();

        if (
            news?.last !== payload.date &&
            !news?.published.includes(payload.date) &&
            new Keywords(keywords).check(payload.text) &&
            (words_blacklist.length ? !new Keywords(words_blacklist).check(payload.text) : true)
        ) { // Проверяем что пост не был опубликован ранее и соответствует ключевым словам
            if (
                (longpoll && filter && payload.owner_id !== payload.from_id) || // Фильтр на записи "Только от имени группы" для LongPoll API
                (!ads && payload.marked_as_ads) ||
                (!donut && payload.donut.is_donut)
            ) {
                return console.log(`[!] Новая запись в кластере #${index} не соответствуют настройкам конфига, пропустим ее.`);
            }

            this.postDate = payload.date;

            await this.parsePost(payload);

            await this.send();
        } else {
            console.log(`[!] Новых записей в кластере #${index} нет или они не соответствуют ключевым словам!`);
        }
    }

    async send(): Promise<void> {
        const { post, repost, builders: [builder], cluster: { index, discord: { webhook_urls, content, username, avatar_url: avatarURL } } } = this;

        builder.setDescription(post + repost);

        await this.pushDate(); // Сохраняем дату поста, чтобы не публиковать его заново

        await Promise.allSettled(
            webhook_urls.map((url) => {
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
                    throw `[!] ${url} не является ссылкой на Discord Webhook.`;
                }
            })
        )
            .then((outputs) => {
                const rejects = outputs.filter(({ status }) => status === "rejected") as PromiseRejectedResult[];

                if (rejects.length) {
                    rejects.forEach(({ reason }) => {
                        console.error("[!] Произошла ошибка при отправке сообщения:");
                        console.error(reason);
                    });
                } else {
                    console.log(`[VK2Discord] Запись в кластере #${index} опубликована.`);
                }
            });
    }

    async pushDate(): Promise<void> {
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
