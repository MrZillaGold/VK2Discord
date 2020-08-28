import fs from "fs";
import webhook from "webhook-discord";

import { Markdown } from "./Markdown.mjs";
import { Attachments } from "./Attachments.mjs";
import { Keywords } from "./Keywords.mjs";

import news from "../news.json";

export class Sender {

    constructor(config) {
        this.config = config;

        this.message = {
            post: {
                text: "",
                attachments: ""
            },
            repost: {
                text: "",
                attachments: ""
            }
        };

        this.builder = new webhook.MessageBuilder();
    }

    async post(payload) {
        const { post, repost } = this.message;
        const { vk, index, VK } = this.config;
        const builder = this.builder;

        const { longpoll, filter, group_id, keywords } = vk;

        const date = payload.date;

        if (
            (news[group_id] && news[group_id].last) !== date &&
            !(news[group_id] && news[group_id].published.includes(date)) &&
            new Keywords(keywords).check(payload.text)
        ) { // Проверяем что пост не был опубликован ранее и соответствует ключевым словам

            if (longpoll && filter && payload.owner_id !== payload.from_id) {
                return;
            } // Фильтр на записи "Только от имени группы" для LongPoll API

            if (payload.text) {
                post.text += `${
                    await new Markdown(payload.text, VK)
                        .fix()
                }\n\n`;
            }

            if (payload.attachments) {
                post.attachments += new Attachments(payload.attachments)
                    .parse(builder);
            }

            const Repost = payload.copy_history ? payload.copy_history[0] : null;

            if (Repost) {
                repost.text +=
                    `\n\n>>> [**Репост записи**](https://vk.com/wall${Repost.from_id}_${Repost.id})\n\n`;

                if (Repost.text) {
                    repost.text += `${
                        await new Markdown(Repost.text, VK)
                            .fix()
                    }\n\n`;
                }

                if (Repost.attachments) {
                    repost.attachments += new Attachments(Repost.attachments)
                        .parse(builder);
                }
            }

            return this.send(date);
        } else {
            console.log(`[!] Новых записей в кластере #${index} нет или они не соответствуют ключевым словам!`);
        }
    }

    send(date) {
        const { post, repost } = this.message;
        const { discord } = this.config;
        const builder = this.builder;

        const { bot_name, color, webhook_urls } = discord;

        this.sliceMessage(); // Обрезаем сообщение перед отправкой в Discord

        builder.setDescription(post.text + post.attachments + repost.text + repost.attachments)
            .setName(bot_name.slice(0, 32))
            .setColor(color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? color : "#aabbcc");

        for (const url of webhook_urls) { // Почему for? В тестах нужно убедится, что отправка произошла без ошибок, forEach с async не очень
            new webhook.Webhook(url)
                .send(builder);
        }

        this.pushDate(date); // Сохраняем дату поста, чтобы не публиковать его заново
    }

    sliceMessage() {
        const { post, repost } = this.message;

        if (post.text.length + post.attachments.length + repost.text.length + repost.attachments.length > 2048) {
            if (post.text) {
                post.text = `${post.text.slice(0, repost.text ? 1021 - post.attachments.length : 2045 - post.attachments.length)}…\n\n`
            }

            if (repost.text) {
                console.log(repost.text)
                repost.text = `${repost.text.slice(0, post.text ? 1021 - repost.attachments.length : 2045 - repost.attachments.length)}…\n\n`
            }
        }
    }

    pushDate(date) {
        const { vk } = this.config;

        const { group_id } = vk;

        if (news[group_id]) {
            news[group_id].last = date;

            news[group_id].published.unshift(date);
            news[group_id].published = news[group_id].published.splice(0, 14);
        } else {
            news[group_id] = {
                last: date,
                published: [
                    date
                ]
            };
        }

        fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
    }
}
