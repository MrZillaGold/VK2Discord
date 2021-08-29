import { MessageEmbed, MessageAttachment } from 'discord.js';
import { AttachmentType, ISharedAttachmentPayload, AttachmentTypeString } from 'vk-io';

import { VK, Message } from './';

import { generateRandomString, LINK_PREFIX } from '../utils';

type AttachmentTypeUnion = AttachmentTypeString | 'textlive';

export type Attachment = {
    type: AttachmentTypeUnion;
} & {
    [key in AttachmentTypeUnion]: any;
};

const { AUDIO, DOCUMENT, LINK, PHOTO, POLL, VIDEO, ALBUM, MARKET, MARKET_ALBUM } = AttachmentType;

export class Attachments {

    VK: VK;

    constructor(VK: VK) {
        this.VK = VK;
    }

    parse(attachments: Attachment[], embeds: Message['embeds'], files: Message['files']): string[] {
        const [embed] = embeds;

        const attachmentFields: string[] = [];

        const parsedAttachments = (
            attachments.map(({ type, photo, video, link, doc, audio, poll, album, textlive, market }) => {
                switch (type) {
                    case PHOTO: {
                        const { sizes } = photo;

                        if (sizes) {
                            if (!embed.image) {
                                embed.setImage(this.popAttachment(sizes))
                                    .setURL('https://twitter.com');
                            } else {
                                embeds.push(
                                    this.createImageEmbed(this.popAttachment(sizes))
                                );
                            }
                        }
                        break;
                    }
                    case VIDEO: {
                        let { owner_id, id, title, live, type, main_artists } = video;

                        const prefix = type === 'music_video' ?
                            '📼 Клип'
                            :
                            live ?
                                '🔴 Трансляция'
                                :
                                '📹 Видео';

                        if (main_artists?.length) {
                            const [{ name }] = main_artists;

                            title += ` - ${name}`;
                        }

                        return `[${prefix}: ${title}](${LINK_PREFIX}${this.generateAttachmentContext(video)}?z=${VIDEO}${owner_id}_${id})`;
                    }
                    case LINK: {
                        const { button_text = 'Ссылка', description, title, url } = link;

                        return `[🔗 ${description || button_text}: ${title}](${url})`;
                    }
                    case DOCUMENT: {
                        const { ext, url, title } = doc;

                        if (ext === 'gif') {
                            const filename = `${generateRandomString(6)}.${ext}`;
                            
                            if (!embed.image) {
                                files.push(
                                    new MessageAttachment(url, filename)
                                );

                                embed.setImage(`attachment://${filename}`);
                            } else if (embeds.length < 10) {
                                files.push(
                                    new MessageAttachment(url, filename)
                                );

                                embeds.push(
                                    this.createImageEmbed(`attachment://${filename}`)
                                );
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
                    case 'textlive': {
                        const { textlive_id, title } = textlive;

                        return `[📣 Репортаж: ${title}](${LINK_PREFIX}textlive${textlive_id})`;
                    }
                }
            })
                .filter((attachment) => attachment) as string[]
        )
            .sort((a, b) => a.localeCompare(b))
            .map((attachment) => `\n${attachment}`);

        parsedAttachments.forEach((attachment, index) => {
            if (!index) {
                attachmentFields[0] = '';
            }

            const field = attachmentFields[attachmentFields.length - 1];

            if ((field + attachment).length < 1024) {
                attachmentFields[attachmentFields.length - 1] += attachment;
            } else if (attachment.length <= 1024) {
                attachmentFields.push(attachment);
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
            .setURL('https://twitter.com')
            .setImage(image_url);
    }

    protected generateAttachmentContext({ owner_id }: ISharedAttachmentPayload): string {
        const isUser = owner_id > 0;

        return `${isUser ? 'id' : 'feed'}${isUser ? Math.abs(owner_id) : ''}`;
    }
}
