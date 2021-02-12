import { MessageEmbed, MessageAttachment } from "discord.js";

import { VK } from "./VK";

import { Attachment, PoppedPhotoAttachment, ParsedAttachments, AttachmentFields } from "../interfaces";

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
                    case "photo":
                        if (photo.sizes) {
                            if (!builder.image) {
                                builder.setImage(this.popAttachment(photo.sizes).url);
                            } else {
                                builders.push(
                                    this.createImageEmbed(this.popAttachment(photo.sizes).url)
                                );
                            }
                        } else {
                            console.log("[!] В записи есть фотографии, но вы не установили версию LongPoll API 5.103 или выше.\nФотографии не будут обработаны.");
                        }
                        break;
                    case "video":
                        const context = `${video.owner_id > 0 ? "id" : "public"}${Math.abs(video.owner_id)}`;

                        return `\n[📹 Видео: ${video.title}](https://vk.com/${context}?z=video${video.owner_id}_${video.id})`;
                    case "link":
                        return `\n[🔗 ${link.button_text || "Ссылка"}: ${link.title}](${link.url})`;
                    case "doc":
                        if (doc.ext === "gif") {
                            if (!builder.image) {
                                builder.attachFiles([
                                    new MessageAttachment(doc.url, doc.title)
                                ])
                                    .setImage(`attachment://${doc.title}`);
                            } else {
                                if (builders.length < 10) {
                                    builders.push(
                                        this.createImageEmbed(`attachment://${doc.title}`)
                                            .attachFiles([
                                                new MessageAttachment(doc.url, doc.title)
                                            ])
                                    );
                                }
                            }
                        } else {
                            return `\n[📄 Файл: ${doc.title}](${doc.url})`;
                        }
                        break;
                    case "audio":
                        return `\n[🎵 Музыка: ${audio.artist} - ${audio.title}](https://vk.com/search?c[section]=audio&c[q]=${encodeURIComponent(audio.artist)}%20-%20${encodeURIComponent(audio.title)}&c[performer]=1)`;
                    case "poll":
                        return `\n[📊 Опрос: ${poll.question}](https://vk.com/feed?w=poll${poll.owner_id}_${poll.id})`;
                    case "album":
                        return `\n[🖼️ Альбом: ${album.title}](https://vk.com/album${album.owner_id}_${album.id})`;
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

    protected popAttachment(attachment: any[]): PoppedPhotoAttachment {
        return attachment
            .sort((a, b) => a.width * a.height - b.width * b.height)
            .pop();
    }

    protected createImageEmbed(image_url: string): MessageEmbed {
        return new MessageEmbed()
            .setURL("https://twitter.com")
            .setImage(image_url);
    }
}
