const fs = require("fs");
const webhook = require("webhook-discord");

const news = require("../news");
const config = require("../config");

const {parseText, getAttachments, parseLinks, checkKeywords, errorHandler} = require("./functions");

const keywords = process.env.KEYWORDS ? process.env.KEYWORDS.split(",") : config.vk.keywords;
const name = process.env.BOT_NAME || config.discord.bot_name;
const color = process.env.COLOR ?
    process.env.COLOR.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? process.env.COLOR : "#aabbcc"
    :
    config.discord.color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? config.discord.color : "#aabbcc";
const url = process.env.WEBHOOK_URL || config.discord.webhook_url;

const discord = new webhook.Webhook(url);

module.exports = async (webhookBuilder, postData, longpoll) => {
    webhookBuilder.setName(name.slice(0, 32))
        .setColor(color);

    const createdAt = longpoll ? postData.createdAt : postData.date;

    if (news.last_post !== createdAt && !(news.published_posts.includes(createdAt)) && checkKeywords(keywords, postData.text)) {
        if (longpoll && config.vk.filter && postData.authorId === postData.createdUserId) return;

        let postText = `[**Открыть пост ВКонтакте**](https://vk.com/wall${longpoll ? postData.authorId : postData.from_id}_${postData.id})\n\n`;

        if (postData.text) postText += parseLinks(postData.text);

        let attachments = "";
        if (postData.attachments) attachments += await getAttachments(postData.attachments, webhookBuilder, longpoll);

        const repost = longpoll ?
            postData.copyHistory ? postData.copyHistory[0] : null
            :
            postData.copy_history ? postData.copy_history[0] : null;

        let repostText = "";
        let reportAttachments = "";
        if (repost) {
            repostText += `\n>>> [**Репост записи**](https://vk.com/wall${repost.from_id}_${repost.id})\n\n`;
            if (repost.text) {
                repostText += parseLinks(repost.text);
            }

            if (repost.attachments) {
                reportAttachments += await getAttachments(repost.attachments, webhookBuilder, longpoll);
            }
        }

        const allPost = postText + attachments + repostText + reportAttachments;

        webhookBuilder.setDescription(parseText(allPost).length > 2048 ?
            (postText ? postText.slice(0, repostText ? 1021 - attachments.length : 2045 - attachments.length) + (postData.text ? "…\n\n" : "") : "")
            + attachments
            + (repostText ? repostText.slice(0, postText ? 1021 - reportAttachments.length : 2045 - reportAttachments.length)  + (repost.text ? "…\n\n" : "") : "")
            + reportAttachments
            :
            allPost);

        discord.send(webhookBuilder)
            .then(() => {
                console.log("[!] Пост успешно опубликован в Discord канале.");

                news.last_post = createdAt;
                news.published_posts.unshift(createdAt);

                if (news.published_posts.length >= 30) news.published_posts.splice(-1, 1);

                fs.writeFileSync("./news.json", JSON.stringify(news, null, "\t"));
            })
            .catch(err => errorHandler(err));
    } else {
        console.log("[!] Новых записей нет или они не соответствуют ключевым словам!");
    }
};