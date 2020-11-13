import fs from "fs";
import Discord from "discord.js";

import { Markdown } from "./Markdown.mjs";
import { Message } from "./Message.mjs";
import { Keywords } from "./Keywords.mjs";

import news from "../news.json";

export class Sender extends Message {

    constructor(config) {
        super();

        this.config = config;

        this.message = {
            post: "",
            repost: ""
        };

        const color = config.discord.color;
        this.builders = [
            new Discord.MessageEmbed()
                .setColor(color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? color : "#aabbcc")
                .setURL("https://twitter.com")
        ];
    }

    async handle(payload) {
        const { longpoll, filter, group_id, keywords, ads, donut, words_blacklist } = this.config.vk;

        if (
            (news[group_id] && news[group_id].last) !== payload.date &&
            !(news[group_id] && news[group_id].published.includes(payload.date)) &&
            new Keywords(keywords).check(payload.text) &&
            (words_blacklist.length ? !new Keywords(words_blacklist).check(payload.text) : true)
        ) { // Проверяем что пост не был опубликован ранее и соответствует ключевым словам

            if (
                (longpoll && filter && payload.owner_id !== payload.from_id) || // Фильтр на записи "Только от имени группы" для LongPoll API
                (!ads && payload.marked_as_ads) ||
                (!donut && payload.donut.is_donut)
            ) {
                return console.log(`[!] Новая запись в кластере #${this.config.index} не соответствуют настройкам конфига, пропустим ее.`);
            }

            await this.parseText(payload);

            return this.send(payload.date);
        } else {
            console.log(`[!] Новых записей в кластере #${this.config.index} нет или они не соответствуют ключевым словам!`);
        }
    }

    async send(date) {
        const { post, repost } = this.message;
        const { webhook_urls, content, username, avatar_url: avatarURL } = this.config.discord;
        const builders = this.builders;

        const [builder] = builders;

        const message = new Markdown(post + repost)
            .sliceFix();

        builder.setDescription(message);

        this.pushDate(date); // Сохраняем дату поста, чтобы не публиковать его заново

        await Promise.allSettled(
            webhook_urls.map((url) => {

                const parsedUrl = /https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/([^]+)\/([^/]+)/g.exec(url);

                if (parsedUrl) {
                    const [, id, token] = parsedUrl;

                    return new Discord.WebhookClient(
                        id,
                        token
                    )
                        .send({
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
                if (outputs.length) {
                    outputs = outputs.filter(({ status }) => status !== "fulfilled");

                    if (outputs.length) {
                        outputs.forEach(({ reason }) => {
                            console.error("[!] Произошла ошибка при отправке сообщения:");
                            console.error(reason);
                        });
                    } else {
                        console.log(`[VK2Discord] Запись в кластере #${this.config.index} опубликована.`);
                    }
                }
            });
    }

    pushDate(date) {
        const { vk } = this.config;

        const { group_id } = vk;

        if (news[group_id]) {
            news[group_id].last = date;

            news[group_id].published.unshift(date);
            news[group_id].published = news[group_id].published.splice(0, 49);
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
