import { MessageAttachment, MessageEmbed } from 'discord.js';
import { IWallPostContextPayload } from 'vk-io';

import { Markdown, Attachments, Attachment } from './';

import { ICluster } from '../';

export enum PostType {
    POST = 'post',
    REPOST = 'repost'
}

export abstract class Message {

    readonly cluster: ICluster;
    readonly abstract payload: IWallPostContextPayload;

    protected post = '';
    protected repost = '';

    embeds: MessageEmbed[];
    files: MessageAttachment[] = [];

    protected constructor(cluster: ICluster) {
        const { discord: { color } } = cluster;

        this.cluster = cluster;

        const embed = new MessageEmbed();

        if (color) {
            embed.setColor(color);
        }

        this.embeds = [embed];
    }

    protected async parsePost(): Promise<void> {
        const { cluster: { VK }, payload: { text, attachments, copy_history } } = this;

        if (text) {
            this.post += `${
                await new Markdown(VK)
                    .fix(text)
            }\n`;
        }

        if (attachments) {
            const parsedAttachments = new Attachments(VK)
                .parse(attachments as Attachment[], this.embeds, this.files);

            this.attachAttachments(parsedAttachments, PostType.POST);
        }

        const repost = copy_history ? copy_history[0] : null;

        if (repost) {
            const { text, from_id, id, attachments } = repost;

            this.repost += `\n>>> [**Репост записи**](https://vk.com/wall${from_id}_${id})`;

            if (text) {
                this.repost += `\n\n${
                    await new Markdown(VK)
                        .fix(text)
                }`;
            }

            if (attachments) {
                const parsedAttachments = new Attachments(VK)
                    .parse(attachments as Attachment[], this.embeds, this.files);

                this.attachAttachments(parsedAttachments, PostType.REPOST);
            }
        }

        this.sliceMessage();
    }

    private attachAttachments(attachmentFields: string[], type: PostType): void {
        const { embeds: [embed] } = this;

        switch (type) {
            case PostType.POST:
                attachmentFields = attachmentFields.slice(0, 24);

                attachmentFields.forEach((attachmentField, index) => {
                    embed.addField(!index ? 'Вложения' : '⠀', attachmentField);
                });
                break;
            case PostType.REPOST:
                if (embed.fields.length) {
                    attachmentFields = attachmentFields.slice(0, (embed.fields.length ? 12 : 25) - 1);

                    embed.spliceFields(
                        -1,
                        embed.fields.length >= 25 ?
                            12
                            :
                            0
                    );
                }

                attachmentFields.forEach((attachmentField, index) => {
                    embed.addField(!index ? 'Вложения репоста' : '⠀', attachmentField);
                });
                break;
        }
    }

    private sliceMessage(): void {
        const { post, repost } = this;

        if ((post + repost).length > 4096) {
            if (post) {
                this.post = Message.sliceFix(`${post.slice(0, (repost ? 2048 : 4096) - 3)}…\n`);
            }

            if (repost) {
                this.repost = Message.sliceFix(`${repost.slice(0, (post ? 2048 : 4096) - 1)}…`);
            }
        }
    }

    private static sliceFix(text: string): string {
        return text.replace(/\[([^\])]+)?]?\(?([^()\][]+)?…/g, '$1…');
    }
}
