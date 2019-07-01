let token = 'токен'; // Токен от страницы ВКонтакте
let id = '-1'; // ID группы из которой брать новости
let url = 'https://discordapp.com/api/webhooks/'; // Ваш Webhook-URL
let time = 3600000; // Интервал получения и отправки новых постов в миллисекундах, не рекомендуется ставить меньше 1 минуты все на ваш страх и риск

const axios = require('axios');
const news = require("./news.json");
const webhook = require("webhook-discord");
const Hook = new webhook.Webhook(url);
const fs = require("fs")

setInterval(() => {
axios.get(`https://api.vk.com/method/wall.get?owner_id=${id}&count=1&extended=1&access_token=${token}&v=5.60`).then(res => {
    return res.data;
}).then(data => {
    let text = data.response.items[0].text;
    let time = data.response.items[0].date;
    let attachments = (data.response.items[0].attachments === undefined) ? 0 : data.response.items[0].attachments[0].type;

    let currentDate = new Date(time * 1000);
    let date = currentDate.getDate();
    let month = currentDate.getMonth();
    let year = currentDate.getFullYear();
    let postdate = date + "." + (month + 1) + "." + year;
    if (news.news == time) {
        console.log(`Новых новостей нет!`)
    } else {
        if (attachments == "photo") {
            const msg = new webhook.MessageBuilder()
                .setName("Steve")
                .setColor("#aabbcc")
                .setTitle(`${data.response.groups[0].name} | ${postdate}`)
		.setDescription(text)
                .setImage(data.response.items[0].attachments[0].photo.photo_1280)
                .setTime(time)
            Hook.send(msg)
            news.news = `${time}`
        } else {
            const msg = new webhook.MessageBuilder()
                .setName("Steve")
                .setColor("#aabbcc")
                .addField(data.response.groups[0].name)
		.setDescription(text)
                .setTime()
            Hook.send(msg)
	    news.news = `${time}`
        }
    }
}).catch(err => console.log(err));
}, time)

setInterval(() => {
    fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
}, 1000)

function getUnix() {
    return Math.floor(Date.now() / 1000);
}
