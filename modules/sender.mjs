import fs from "fs";

import webhook from "webhook-discord";

import { notify } from "./functions";

import news from "../news";

export class Sender {
    options = {};

    state = {
        post: {
            text: "",
            attachments: ""
        },
        repost: {
            text: "",
            attachments: ""
        },
        webhookBuilders: []
    };

    setOptions(options) {
        this.options = options;
    }

    async post(builder, postData) {
        const { post, repost, webhookBuilders } = this.state;

        const { vk, index } = this.options;
        const { longpoll, filter, group_id } = vk;

        webhookBuilders.push(builder);

        const createdAt = longpoll ? postData.createdAt : postData.date;

        if ((news[group_id] && news[group_id].last) !== createdAt && !(news[group_id] && news[group_id].published.includes(createdAt)) && this.checkKeywords(postData.text)) { // Проверяем что пост не был опубликован и соответствует ключевым словам

            if (longpoll && filter && postData.authorId === postData.createdUserId) return; // Фильтр на записи только от имени группы для LongPoll

            post.text += `[**Открыть запись ВКонтакте**](https://vk.com/wall${longpoll ? postData.authorId : postData.from_id}_${postData.id})\n\n`;

            if (postData.text) post.text += `${await this.fixMarkdown(this.fixLinks(postData.text))}\n\n`;

            if (postData.attachments) post.attachments += await this.parseAttachments(postData.attachments);

            const Repost = longpoll ?
                postData.copyHistory ? postData.copyHistory[0] : null
                :
                postData.copy_history ? postData.copy_history[0] : null;

            if (Repost) {
                repost.text += `\n\n>>> [**Репост записи**](https://vk.com/wall${longpoll ? Repost.authorId : Repost.from_id}_${Repost.id})\n\n`;

                if (Repost.text) repost.text += `${await this.fixMarkdown(this.fixLinks(Repost.text))}\n\n`;

                if (Repost.attachments) repost.attachments += await this.parseAttachments(Repost.attachments);
            }

            this.send(createdAt);
        } else {
            console.log(`[!] Новых записей в кластере #${index} нет или они не соответствуют ключевым словам!`);
        }
    }

    async parseAttachments(attachments) {
        const { webhookBuilders } = this.state;
        const [builder] = webhookBuilders;

        const { vk } = this.options;
        const { longpoll } = vk;

        let text = "";

        await attachments.forEach(item => {
            const type = item.type;

            switch (type) {
                case "photo":
                    if (!builder.data.attachments[0].image_url) {
                        builder.setImage((longpoll ? item.sizes : item.photo.sizes).pop().url);
                    }
                    break;
                case "video":
                    const video = longpoll ? item : item.video;

                    text += `\n[:video_camera: Смотреть видео: ${video.title}](https://vk.com/video${longpoll ? video.ownerId : video.owner_id}_${video.id})`;
                    break;
                case "link":
                    const link = longpoll ? item : item.link;

                    text += `\n[:link: ${link.button_text || "Ссылка"}: ${link.title}](${link.url})`;
                    break;
                case "doc":
                    const doc = longpoll ? item : item.doc;
                    const ext = longpoll ? doc.typeName : doc.ext;

                    if (ext === "gif") {
                        builder.setImage(doc.url);
                    } else {
                        text += `\n[:page_facing_up: Документ: ${doc.title}](${doc.url})`;
                    }
                    break;
                case "audio":
                    const audio = longpoll ? item : item.audio;

                    const artist = audio.artist;
                    const title = audio.title;

                    text += `\n[:musical_note:  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                    break;
                case "poll":
                    const poll = longpoll ? item : item.poll;

                    text += `\n[:bar_chart: Опрос: ${poll.question}](https://vk.com/feed?w=poll${longpoll ? poll.ownerId : poll.owner_id}_${poll.id})`;
                    break;
            }
        });

        /*if (sendAll) {
            await this.parsePhotos(attachments);
        }*/

        return text;
    }

    /*async parsePhotos(attachments) {
        const { webhookBuilders } = this.state;

        const photos = attachments.filter(attachment => attachment.type === "photo");

        await photos.forEach((item, index) => {
            const builder = new webhook.MessageBuilder();

            if (photos.length > 1 && index === 0) return;

            builder.setImage((longpoll ? item.sizes : item.photo.sizes).pop().url);

            webhookBuilders.push(builder);
        });
    }*/

    checkKeywords(text) {
        const { vk } = this.options;
        const { keywords } = vk;

        if (keywords.length > 0) {
            return keywords.some(keyword => {
                return text.match(keyword, "gi");
            });
        } else {
            return true;
        }
    }

    fixLinks(text) {
        return text
            .replace(/(?:\[(https:\/\/vk.com\/[^]+?)\|([^]+?)])/g, "[$2]($1)")
            .replace(/(?:\[([^]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)");
    }

    async fixMarkdown(text) {
        const { VKIO } = this.options;
        const { snippets } = VKIO;

        let fixedText = text;

        const regExp = /#([^\s]+)@([a-zA-Z_]+)/g;

        const matches = regExp.exec(text);

        fixedText = fixedText
            .replace(/#([^\s]+)/g, (match, p1) => {
                if (match.match(regExp)) return match;

                return `[#${p1}](https://vk.com/feed?section=search&q=%23${p1})`;
            });

        if (matches) {
            const resource = await snippets.resolveResource(matches[2])
                .catch(() => null);

            if (resource && resource.type === "group") {
                fixedText = text.replace(regExp, (match, p1, p2) => {
                    if (p1.match(/[a-zA-Z]+/)) return `[#${p1}@${p2}](https://vk.com/${p2}/${p1})`;

                    return `[#${p1}@${p2}](https://vk.com/wall-${resource.id}?q=%23${p1})`;
                });
            }
        }

        try {
            return decodeURI(fixedText);
        } catch {
            return fixedText;
        }
    }

    async send(createdAt) {
        const { post, repost, webhookBuilders } = this.state;

        const { discord, index, vk } = this.options;

        const { bot_name, color, webhook_urls } = discord;
        const { group_id } = vk;

        const builder = webhookBuilders[0]
            .setName(bot_name.slice(0, 32))
            .setColor(color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? color : "#aabbcc");

        if (post.text.length + post.attachments.length + repost.text.length + repost.attachments.length > 2048) {
            if (post.text) {
                post.text = post.text.slice(0, repost.text ? 1021 - post.attachments.length : 2045 - post.attachments.length) + "…\n\n"
            }

            if (repost.text) {
                repost.text = repost.text.slice(0, post.text ? 1021 - repost.attachments.length : 2045 - repost.attachments.length) + "…\n\n"
            }
        }

        builder.setDescription(post.text + post.attachments + repost.text + repost.attachments);

        webhook_urls.forEach((url, channel) => {
            new webhook.Webhook(url)
                .send(builder)
                .then(console.log(`[VK2DISCORD] Запись от кластера #${index} успешно опубликована в Discord-канале #${channel + 1}.`))
                .catch((error) => notify(error));
        });

        if (news[group_id]) {
            news[group_id].last = createdAt;

            news[group_id].published.unshift(createdAt);
            news[group_id].published = news[group_id].published.splice(0, 14);
        } else {
            news[group_id] = {
                last: createdAt,
                published: [
                    createdAt
                ]
            }
        }

        fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
    }
}
