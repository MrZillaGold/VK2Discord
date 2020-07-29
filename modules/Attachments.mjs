export class Attachments {

    constructor(attachments) {
        this.attachments = attachments;
    }

    parse(builder) {
        const { attachments } = this;

        return attachments.map(attachment => {
            const type = attachment.type;

            switch (type) {
                case "photo":
                    if (!builder.data.attachments[0].image_url) {
                        builder.setImage(attachment.photo.sizes.pop().url);
                    }
                    break;
                case "video":
                    const video = attachment.video;

                    return `\n[:video_camera: Смотреть видео: ${video.title}](https://vk.com/video${video.owner_id}_${video.id})`;
                case "link":
                    const link = attachment.link;

                    return `\n[:link: ${link.button_text || "Ссылка"}: ${link.title}](${link.url})`;
                case "doc":
                    const doc = attachment.doc;
                    const ext = doc.ext;

                    if (ext === "gif") {
                        builder.setImage(doc.url);
                    } else {
                        return `\n[:page_facing_up: Документ: ${doc.title}](${doc.url})`;
                    }
                    break;
                case "audio":
                    const audio = attachment.audio;

                    const artist = audio.artist;
                    const title = audio.title;

                    return `\n[:musical_note:  Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURI(artist.replace(/&/g, "и"))}%20-%20${encodeURI(title)}&c[performer]=1)`;
                case "poll":
                    const poll = attachment.poll;

                    return `\n[:bar_chart: Опрос: ${poll.question}](https://vk.com/feed?w=poll${poll.owner_id}_${poll.id})`;
            }
        })
            .join("");
    }
}
