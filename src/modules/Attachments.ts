import { MessageEmbed, MessageAttachment } from "discord.js";

import { VK } from "./VK.js";

import { Attachment, ParsedAttachments, AttachmentFields } from "../interfaces";

export class Attachments {

    VK: VK;

    constructor(VK: VK) {
        this.VK = VK;
    }

    parse(attachments: Attachment[], builders: MessageEmbed[]): string[] {
        const [builder] = builders;

        const attachmentFields: AttachmentFields = [];

        const parsedAttachments = (
            attachments.map(({ type, photo, video, link, doc, audio, poll, album }) => {
                switch (type) {
                    case "photo": {
                        const { sizes } = photo;

                        if (sizes) {
                            if (!builder.image) {
                                builder.setImage(this.popAttachment(sizes));
                            } else {
                                builders.push(
                                    this.createImageEmbed(this.popAttachment(sizes))
                                );
                            }
                        } else {
                            console.log("[!] В записи есть фотографии, но вы не установили версию LongPoll API 5.103 или выше.\nФотографии не будут обработаны.");
                        }
                        break;
                    }
                    case "video": {
                        const { owner_id, title, id } = video;
                        const context = `${owner_id > 0 ? "id" : "public"}${Math.abs(owner_id)}`;

                        return `\n[📹 Видео: ${title}](https://vk.com/${context}?z=video${owner_id}_${id})`;
                    }
                    case "link": {
                        const { button_text = "Ссылка", description, title, url } = link;

                        return `\n[🔗 ${description || button_text}: ${title}](${url})`;
                    }
                    case "doc": {
                        const { ext, url, title } = doc;

                        if (ext === "gif") {
                            if (!builder.image) {
                                builder.attachFiles([
                                    new MessageAttachment(url, title)
                                ])
                                    .setImage(`attachment://${title}`);
                            } else {
                                if (builders.length < 10) {
                                    builders.push(
                                        this.createImageEmbed(`attachment://${title}`)
                                            .attachFiles([
                                                new MessageAttachment(url, title)
                                            ])
                                    );
                                }
                            }
                        } else {
                            return `\n[📄 Файл: ${title}](${url})`;
                        }
                        break;
                    }
                    case "audio": {
                        const { artist, title } = audio;

                        return `\n[🎵 Музыка: ${artist} - ${title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURIComponent(artist)}%20-%20${encodeURIComponent(title)}&c[performer]=1)`;
                    }
                    case "poll": {
                        const { question, owner_id, id } = poll;

                        return `\n[📊 Опрос: ${question}](https://vk.com/feed?w=poll${owner_id}_${id})`;
                    }
                    case "album": {
                        const { title, owner_id, id } = album;

                        return `\n[🖼️ Альбом: ${title}](https://vk.com/album${owner_id}_${id})`;
                    }
                }
            })
                .filter((attachment) => attachment) as ParsedAttachments
        )
            .sort((a, b) => b.length - a.length);

        parsedAttachments.forEach((attachment, index) => {
            if (!index) {
                attachmentFields[0] = "";
            }

            const field = attachmentFields[attachmentFields.length - 1];

            if ((field + attachment).length < 1024) {
                attachmentFields[attachmentFields.length - 1] += attachment;
            } else {
                if (attachment.length <= 1024) {
                    attachmentFields.push(attachment);
                }
            }
        });

        return attachmentFields;
    }

    protected popAttachment(attachment: any[]): string {
        return attachment
            .sort((a, b) => a.width * a.height - b.width * b.height)
            .pop()
            .url;
    }

    protected createImageEmbed(image_url: string): MessageEmbed {
        return new MessageEmbed()
            .setURL("https://twitter.com")
            .setImage(image_url);
    }
}
