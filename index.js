const config = require("./config");
const axios = require("axios");
const news = require("./news.json");
const webhook = require("webhook-discord");
const fs = require("fs");

const token = config.token;
let id = config.group_id;
const url = config.webhook_url;
const name = config.bot_name;
const interval = config.interval;
const color = config.color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? config.color : "#aabbcc";

const Hook = new webhook.Webhook(url);

if (id > 0) {
    id = -id;
}

if (interval < 10000) {
    console.log("[!] Не рекомендуем ставить интервал получения постов меньше 10 секунд, во избежания лимитов ВКонтакте!")
}

setInterval(() => {
    const webhookbuilder = new webhook.MessageBuilder()
        .setName(name.slice(0, 32))
        .setColor(color);
    axios.get(`https://api.vk.com/method/wall.get?owner_id=${id}&count=2&extended=1&access_token=${token}&v=5.103${config.filter && "&filter=owner"}`)
        .then(async res => {
            if (res.data.error) {
                const error = res.data.error;
                console.log(`[!] Ошибка ВКонтакте:\nКод ошибки: ${error.error_code}\n${error.error_msg}\n\nЕсли не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`);
                process.exit(-1);
            }

            if (res.data.response.items) {
                let data;
                if (res.data.response.items.length === 2 && res.data.response.items[1].date > res.data.response.items[0].date) {
                    data = res.data.response.items[1];
                } else {
                    data = res.data.response.items[0];
                }


                if (news.last_post !== data.date && !(news.published_posts.includes(data.date)) && checkTextOnKeywords(config.keywords, data.text)) {
                    let text = `[**Открыть пост ВКонтакте**](https://vk.com/wall${data.from_id}_${data.id})\n\n`;
                    if (data.text) {
                        text += parseLinks(data.text);
                    }

                    const attachments = data.attachments;
                    if (attachments) {
                        text += await getAttachments(attachments, webhookbuilder);
                    }

                    const repost = data.copy_history;
                    if (repost) {
                        text += `\n>>> [**${res.data.response.groups[1].name}** | Репост записи](https://vk.com/wall${data.from_id}_${data.id})\n\n`;
                        if (repost[0].text) {
                            text += parseLinks(repost[0].text);
                        }

                        const attachments = repost[0].attachments;
                        if (attachments) {
                            text += await getAttachments(attachments);
                        }
                    }

                    webhookbuilder.setDescription(text);
                    webhookbuilder.setFooter(res.data.response.groups[0].name, res.data.response.groups[0].photo_50);

                    Hook.send(webhookbuilder)
                        .then(() => console.log(`[!] Пост успешно опубликован в Discord канале.`))
                        .catch(err => console.log(`[!] Возникла ошибка при отправке поста в канал Discord: ${err}.`));
                    news.last_post = data.date;
                    news.published_posts.unshift(data.date);
                    if (news.published_posts.length >= 15) {
                        news.published_posts.splice(-1, 1);
                    }
                    fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
                } else {
                    console.log(`[!] Новых записей нет или они не соответствуют ключевым словам!`);
                }
            } else {
                console.log("[!] Не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конигурации.")
            }
        })
        .catch(err => console.log(`[!] Возникла ошибка: ${err}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`));
}, interval);

async function getAttachments(attachments, webhookbuilder) {
    let text = "";
    await attachments.reverse().forEach(item => {
        if (item.photo && webhookbuilder) {
            webhookbuilder.setImage(item.photo.sizes.pop().url)
        }
        if (item.poll) {
            let answers = "";
            item.poll.answers.forEach(item => answers += `\n• ${item.text}`);
            text += `\n[:bar_chart: Опрос: ${item.poll.question}](https://vk.com/feed?w=poll${item.poll.owner_id}_${item.poll.id})`;
        }
        if (item.video) {
            text += `\n[:video_camera: Смотреть видео: ${item.video.title}](https://vk.com/video${item.video.owner_id}_${item.video.id})`;
        }
        if (item.link) {
            text += `\n[:link: ${item.link.button_text || "Ссылка"}: ${item.link.title}](${item.link.url})`;
        }
        if (item.doc) {
            text += `\n[:page_facing_up: Документ: ${item.doc.title}](${item.doc.url})`;
        }
        if (item.audio) {
            text += `\n[:musical_note:  Музыка: ${item.audio.artist} - ${item.audio.title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(item.audio.artist.replace(/&/g, "и"))}%20-%20${encodeURI(item.audio.title)}&c[performer]=1)`;
        }
    });
    return text;
}

function parseLinks(text) {
    return `${text.replace(/(?:\[([^]+?)\|([^]+?)])/g, '[$2](https://vk.com/$1)')}\n\n`
}

function checkTextOnKeywords(keywords, text) {
    if (keywords.length > 0) {
        return keywords.some(keyword => {
            return text.match(keyword, 'gi');
        });
    } else {
        return true;
    }
}
