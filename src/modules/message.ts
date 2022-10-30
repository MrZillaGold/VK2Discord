import { HexColorString, MessageAttachment, MessageEmbed } from 'discord.js';
import { IWallPostContextPayload } from 'vk-io';
import { WallWallpostFull } from 'vk-io/lib/api/schemas/objects';

import { Attachment, Attachments } from './attachments.js';
import { Markdown } from './markdown.js';
import { Exclude, Cluster } from './handler.js';

export enum PostType {
    POST = 'post',
    REPOST = 'repost'
}

const MAX_EMBED_DESCRIPTION_LENGTH = 4096;

// noinspection JSMethodCanBeStatic
export abstract class Message {

    readonly cluster: Cluster;
    readonly abstract payload: WallWallpostFull | IWallPostContextPayload;

    protected post = '';
    protected repost = '';

    embeds: MessageEmbed[];
    files: MessageAttachment[] = [];

    protected constructor(cluster: Cluster) {
        const { discord: { color } } = cluster;

        this.cluster = cluster;

        const embed = new MessageEmbed();

        if (color) {
            embed.setColor(color as HexColorString);
        }

        this.embeds = [embed];
    }

    protected async parsePost(): Promise<void> {
        const { cluster, payload: { text, attachments, copy_history } } = this;
        const { VK, discord: { exclude_content } } = cluster;

        const attachmentsParser = new Attachments(cluster);
        const markdown = new Markdown(VK);

        if (text && !exclude_content.includes(Exclude.TEXT)) {
            this.post += `${await markdown.fix(text)}\n`;
        }

        if (attachments && !exclude_content.includes(Exclude.ATTACHMENTS)) {
            const parsedAttachments = attachmentsParser.parse(attachments as Attachment[], this.embeds, this.files);

            this.attach(parsedAttachments, PostType.POST);
        }

        const repost = copy_history ? copy_history[0] : null;

        if (repost && !exclude_content.includes(Exclude.REPOST_TEXT) && !exclude_content.includes(Exclude.REPOST_ATTACHMENTS)) {
            const { text, from_id, id, attachments } = repost;

            this.repost += `\n>>> [**Репост записи**](https://vk.com/wall${from_id}_${id})`;

            if (text && !exclude_content.includes(Exclude.REPOST_TEXT)) {
                this.repost += `\n\n${await markdown.fix(text)}`;
            }

            if (attachments && !exclude_content.includes(Exclude.REPOST_ATTACHMENTS)) {
                const parsedAttachments = attachmentsParser.parse(attachments as Attachment[], this.embeds, this.files);

                this.attach(parsedAttachments, PostType.REPOST);
            }
        }

        this.#sliceMessage();
    }

    private attach(attachmentFields: string[], type: PostType): void {
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

    #sliceMessage(): void {
        const { post, repost } = this;

        if ((post + repost).length > MAX_EMBED_DESCRIPTION_LENGTH) {
            if (post) {
                const suffix = '…\n';

                this.post = this.#sliceFix(`${post.slice(
                    0, 
                    (repost ? MAX_EMBED_DESCRIPTION_LENGTH / 2 : MAX_EMBED_DESCRIPTION_LENGTH) - suffix.length
                )}${suffix}`);
            }

            if (repost) {
                const suffix = '…';

                this.repost = this.#sliceFix(`${repost.slice(
                    0,
                    (post ? MAX_EMBED_DESCRIPTION_LENGTH / 2 : MAX_EMBED_DESCRIPTION_LENGTH) - suffix.length
                )}${suffix}`);
            }
        }
    }

    #sliceFix(text: string): string {
        return text.replace(/\[([^\])]+)?]?\(?([^()\][]+)?…/g, '$1…');
    }
}
