import { MessageEmbed, MessageAttachment } from "discord.js";
import { AttachmentType, ISharedAttachmentPayload } from "vk-io";

import { VK } from "./VK.js";

import { LINK_PREFIX } from "./functions.js";

import { Attachment, ParsedAttachments, AttachmentFields } from "../interfaces";

const { AUDIO, DOCUMENT, LINK, PHOTO, POLL, VIDEO, ALBUM, MARKET, MARKET_ALBUM } = AttachmentType;

export class Attachments {

    VK: VK;

    constructor(VK: VK) {
        this.VK = VK;
    }

    parse(attachments: Attachment[], builders: MessageEmbed[]): string[] {
        const [builder] = builders;

        const attachmentFields: AttachmentFields = [];

        const parsedAttachments = (
            attachments.map(({ type, photo, video, link, doc, audio, poll, album, textlive, market }) => {
                switch (type) {
                    case PHOTO: {
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
                    case VIDEO: {
                        const { owner_id, id, title, live } = video;

                        return `[${live ? "🔴 Трансляция" : "📹 Видео"}: ${title}](${LINK_PREFIX}${this.generateAttachmentContext(video)}?z=${VIDEO}${owner_id}_${id})`;
                    }
                    case LINK: {
                        const { button_text = "Ссылка", description, title, url } = link;

                        return `[🔗 ${description || button_text}: ${title}](${url})`;
                    }
                    case DOCUMENT: {
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
                            return `[📄 Файл: ${title}](${url})`;
                        }
                        break;
                    }
                    case AUDIO: {
                        const { owner_id, id, artist, title } = audio;

                        return `[🎵 Аудиозапись: ${artist} - ${title}](${LINK_PREFIX}${AUDIO}${owner_id}_${id})`;
                    }
                    case POLL: {
                        const { owner_id, id, question } = poll;

                        return `[📊 Опрос: ${question}](${LINK_PREFIX}${this.generateAttachmentContext(poll)}?w=${POLL}${owner_id}_${id})`;
                    }
                    case ALBUM: {
                        const { owner_id, id, title } = album;

                        return `[🖼️ Альбом: ${title}](${LINK_PREFIX}${ALBUM}${owner_id}_${id})`;
                    }
                    case MARKET: {
                        const { owner_id, id, title } = market;

                        return `[🛍️ Товар: ${title}](${LINK_PREFIX}${MARKET}${owner_id}?w=product${owner_id}_${id})`;
                    }
                    case MARKET_ALBUM: {
                        const { owner_id, id, title } = market;

                        return `[🛍️ Подборка товаров: ${title}](${LINK_PREFIX}${MARKET}${owner_id}?section=${ALBUM}_${id})`;
                    }
                    case "textlive": {
                        const { textlive_id, title } = textlive;

                        return `[📣 Репортаж: ${title}](${LINK_PREFIX}textlive${textlive_id})`;
                    }
                }
            })
                .filter((attachment) => attachment) as ParsedAttachments
        )
            .sort((a, b) => b.length - a.length)
            .map((attachment) => `\n${attachment}`);

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

    protected generateAttachmentContext({ owner_id }: ISharedAttachmentPayload): string {
        const isUser = owner_id > 0;

        return `${isUser ? "id" : "feed"}${isUser ? Math.abs(owner_id) : ""}`;
    }
}
