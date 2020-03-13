function parseLinks(text) {
    return `${text.replace(/(?:\[([^]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)")}\n\n`;
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

    await attachments.forEach(item => {
        const type = item.type;

        switch (type) {
            case "photo":
                if (!webhookBuilder.data.attachments[0].image_url) webhookBuilder.setImage((longpoll ? item.sizes : item.photo.sizes).pop().url);
                break;
            case "video":
                text += `\n[:video_camera: Смотреть видео: ${(longpoll ? item : item.video).title}](https://vk.com/video${longpoll ? item.ownerId : item.video.owner_id}_${(longpoll ? item : item.video).id})`;
                break;
            case "link":
                text += `\n[:link: ${(longpoll ? item : item.link).button_text || "Ссылка"}: ${(longpoll ? item : item.link).title}](${(longpoll ? item : item.link).url})`;
                break;
            case "doc":
                text += `\n[:page_facing_up: Документ: ${(longpoll ? item : item.doc).title}](${(longpoll ? item : item.doc).url})`;
                break;
            case "audio":
                const artist = (longpoll ? item : item.audio).artist;
                const title = (longpoll ? item : item.audio).title;

                text += `\n[:musical_note:  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                break;
            case "poll":
                let answers = "";

                (longpoll ? item : item.poll).answers.forEach(item => answers += `\n• ${item.text}`);
                text += `\n[:bar_chart: Опрос: ${(longpoll ? item : item.poll).question}](https://vk.com/feed?w=poll${longpoll ? item.ownerId : item.poll.owner_id}_${(longpoll ? item : item.poll).id})`;
                break;
        }
    });
    return text;
}

function errorHandler(error) {
    console.log(`[!] Возникла ошибка: ${error}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/id233731786`);
}

module.exports = {
    parseLinks,
    parseText,
    checkKeywords,
    getAttachments,
    errorHandler
};
