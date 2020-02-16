function parseLinks(text) {
    return `${text.replace(/(?:\[([^]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)")}\n\n`
}

function parseText(text) {
    return text.replace(/\[([^]+)]\([^]+\)/g, "$1")
}

function checkKeywords(keywords, text) {
    if (keywords.length > 0) {
        return keywords.some(keyword => {
            return text.match(keyword, "gi");
        });
    } else {
        return true;
    }
}

async function getAttachments(attachments, webhookBuilder, longpoll) {
    let text = "";

    await attachments.reverse().forEach(item => {
        const type = item.type;

        switch (type) {
            case "photo":
                if (!webhookBuilder.data.attachments[0].image_url) webhookBuilder.setImage(longpoll ? item.sizes.pop().url : item.photo.sizes.pop().url);
                break;
            case "video":
                text += `\n[:video_camera: Смотреть видео: ${longpoll ? item.title : item.video.title}](https://vk.com/video${longpoll ? item.ownerId : item.video.owner_id}_${longpoll ? item.id : item.video.id})`;
                break;
            case "link":
                text += `\n[:link: ${(longpoll ? item.button_text : item.link.button_text) || "Ссылка"}: ${longpoll ? item.title : item.link.title}](${longpoll ? item.url : item.link.url})`;
                break;
            case "doc":
                text += `\n[:page_facing_up: Документ: ${longpoll ? item.title : item.doc.title}](${longpoll ? item.url : item.doc.url})`;
                break;
            case "audio":
                const artist = longpoll ? item.artist : item.audio.artist;
                const title = longpoll ? item.title : item.audio.title;

                text += `\n[:musical_note:  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                break;
            case "poll":
                let answers = "";

                (longpoll ? item.answers : item.poll.answers).forEach(item => answers += `\n• ${item.text}`);
                text += `\n[:bar_chart: Опрос: ${longpoll ? item.question : item.poll.question}](https://vk.com/feed?w=poll${longpoll ? item.ownerId : item.poll.owner_id}_${longpoll ? item.id : item.poll.id})`;
                break;
        }
    });
    return text;
}

function errorHandler(error) {
    console.log(`[!] Возникла ошибка: ${error}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/egorlisss`);
}

module.exports = {parseLinks, parseText, checkKeywords, getAttachments, errorHandler};