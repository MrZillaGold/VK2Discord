const token = 'токен'; // Токен от СТРАНИЦЫ ПОЛЬЗОВАТЕЛЯ ВКонтакте, получить можно тут: https://vk.cc/9bJ69C
let id = '-1'; // ID группы из которой брать новости
const url = 'https://discordapp.com/api/webhooks/'; // Ваш Webhook-URL
const name = 'WebHook'; // Имя для вашего WebHook, выcвечиваетеся в качестве имени бота.
const time = 60000; // Интервал получения и отправки новых постов в миллисекундах

const axios = require('axios');
const news = require("./news.json");
const webhook = require("webhook-discord");
const Hook = new webhook.Webhook(url);
const fs = require('fs');

const webhookbuilder = new webhook.MessageBuilder()
    .setName(name.slice(0, 32))
    .setColor("#aabbcc");

if (id > 0) {
    id = `-${id}`;
}

setInterval(() => {
    axios.get(`https://api.vk.com/method/wall.get?owner_id=${id}&count=2&extended=1&access_token=${token}&v=5.101`).then(res => {
        webhookbuilder.setFooter(res.data.response.groups[0].name, res.data.response.groups[0].photo_50);
        if (res.data.response.items[1].date > res.data.response.items[0].date) {
            return res.data.response.items[1];
        } else {
            return res.data.response.items[0];
        }
    }).then(data => {
        if (news.time !== data.date) {

            let text = `[Открыть пост ВКонтакте](https://vk.com/wall${data.from_id}_${data.id})\n\n`;

            if (data.text){
                text += `${data.text}\n\n`;
            }

            const attachments = data.attachments;

            if(attachments) {

                attachments.forEach(function(item) {

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
                        text += `\n[:link: ${item.link.button_text}: ${item.link.title}](${item.link.url})`;
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
                .then(res => console.log(`Пост успешно опубликован в Discord канале.`))
                .catch(err => console.log(err));
            news.time = data.date;
        } else {
            console.log(`Новых новостей нет!`);
        }
    }).catch(err => console.log(`Возникла ошибка: ${err}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`));
}, time);

setInterval(() => {
    fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
}, 1000);
