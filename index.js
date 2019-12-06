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
        .then(res => {
            if (res.data.error) {
                const error = res.data.error;
                console.log(`[!] Ошибка ВКонтакте:\nКод ошибки: ${error.error_code}\n${error.error_msg}\n\nЕсли не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`);
                process.exit(-1);
            }
            webhookbuilder.setFooter(res.data.response.groups[0].name, res.data.response.groups[0].photo_50);
            if (res.data.response.items.length === 2 && res.data.response.items[1].date > res.data.response.items[0].date) {
                return res.data.response.items[1];
            } else {
                return res.data.response.items[0];
            }
        })
        .then(data => {
            if (news.last_post !== data.date && !(news.published_posts.includes(data.date))) {
                let text = `[Открыть пост ВКонтакте](https://vk.com/wall${data.from_id}_${data.id})\n\n`;
                if (data.text) {
                    text += `${data.text.replace(/(?:\[([^]+?)\|([^]+?)])/g, '[$2](https://vk.com/$1)')}\n\n`;
                }
                const attachments = data.attachments;
                if(attachments) {
                    attachments.reverse().forEach(item => {
                        if (item.photo) {
                            webhookbuilder.setImage(item.photo.sizes.pop().url)
                        }
                        if (item.poll) {
                            let answers = "";
                            item.poll.answers.forEach(item => answers += `\n• ${item.text}`);
                            text += `\n---\n**Опрос:** [**${item.poll.question}**](https://vk.com/feed?w=poll${item.poll.owner_id}_${item.poll.id})\n**Варианты ответа:**${answers}\n---`;
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
                }
                webhookbuilder.setDescription(text);

                Hook.send(webhookbuilder)
                    .then(() => console.log(`[!] Пост успешно опубликован в Discord канале.`))
                    .catch(err => console.log(err));
                news.last_post = data.date;
                news.published_posts.unshift(data.date);
                if (news.published_posts.length >= 15) {
                    news.published_posts.splice(-1, 1);
                }
                fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
            } else {
                console.log(`[!] Новых новостей нет!`);
            }
        })
        .catch(err => console.log(`[!] Возникла ошибка: ${err}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`));
}, interval);
