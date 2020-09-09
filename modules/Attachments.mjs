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
                        if (photo.sizes) {
                            builder.setImage(this.popAttachment(photo.sizes).url);
                        } else {
                            console.log("[!] В записи есть фотографии, но вы не установили версию LongPoll API 5.103 или выше.\nФотографии не будут обработаны.");
                        }
                    }
                    break;
                case "video":
                    return `\n[📹 Видео: ${video.title}](https://vk.com/video${video.owner_id}_${video.id})`;
                case "link":
                    return `\n[🔗 ${link.button_text || "Ссылка"}: ${link.title}](${link.url})`;
                case "doc":
                    if (doc.ext === "gif" && !builder.data.attachments[0].image_url) {
                        const gif = this.popAttachment(doc.preview.photo.sizes).src;

                        builder.setImage(gif);
                    } else {
                        return `\n[📄 Документ: ${doc.title}](${doc.url})`;
                    }
                    break;
                case "audio":
                    const { artist, title } = audio;

                    return `\n[🎵  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                case "poll":
                    return `\n[📊 Опрос: ${poll.question}](https://vk.com/feed?w=poll${poll.owner_id}_${poll.id})`;
            }
        })
            .join("");
    }

    popAttachment(attachment) {
        return attachment
            .sort((a, b) => a.width * a.height - b.width * b.height)
            .pop();
    }
}
