export class Attachments {

    constructor(attachments) {
        this.attachments = attachments;
    }

    parse(builder) {
        const { attachments } = this;

        return attachments.map(({ type, photo, video, link, doc, audio, poll }) => {
            switch (type) {
                case "photo":
                    if (!builder.data.attachments[0].image_url) {
                        builder.setImage(photo.sizes.pop().url);
                    }
                    break;
                case "video":
                    return `\n[:video_camera: Смотреть видео: ${video.title}](https://vk.com/video${video.owner_id}_${video.id})`;
                case "link":
                    return `\n[:link: ${link.button_text || "Ссылка"}: ${link.title}](${link.url})`;
                case "doc":
                    if (doc.ext === "gif") {
                        builder.setImage(doc.url);
                    } else {
                        return `\n[:page_facing_up: Документ: ${doc.title}](${doc.url})`;
                    }
                    break;
                case "audio":
                    const { artist, title } = audio;

                    return `\n[:musical_note:  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                case "poll":
                    return `\n[:bar_chart: Опрос: ${poll.question}](https://vk.com/feed?w=poll${poll.owner_id}_${poll.id})`;
            }
        })
            .join("");
    }
}
