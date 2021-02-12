import { MessageEmbed } from "discord.js";
import { IWallAttachmentPayload } from "vk-io";

import { Markdown } from "./Markdown.js";
import { Attachments } from "./Attachments.js";

import { Attachment, AttachmentFields, AttachmentFieldsType, Cluster } from "../interfaces";

export class Message {

    cluster: Cluster;

    protected post: string;
    protected repost: string;

    builders: MessageEmbed[];

    constructor(cluster: Cluster) {
        this.cluster = cluster;

        this.post = "";
        this.repost = "";

        const color: string = cluster.discord.color;
        this.builders = [
            new MessageEmbed()
                .setColor(color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? color : "#aabbcc")
                .setURL("https://twitter.com")
        ];
    }

    protected async parsePost(payload: IWallAttachmentPayload): Promise<void> {
        const { cluster: { VK } } = this;

        if (payload.text) {
            this.post += `${
                await new Markdown(VK)
                    .fix(payload.text)
            }\n`;
        }

        if (payload.attachments) {
            const parsedAttachments = new Attachments(VK)
                .parse(payload.attachments as Attachment[], this.builders);

            this.attachAttachments(parsedAttachments, "post");
        }

        const repost: IWallAttachmentPayload | null = payload.copy_history ? payload.copy_history[0] : null;

        if (repost) {
            this.repost += `\n>>> [**Репост записи**](https://vk.com/wall${repost.from_id}_${repost.id})`;

            if (repost.text) {
                this.repost += `\n\n${
                    await new Markdown(VK)
                        .fix(repost.text)
                }`;
            }

            if (repost.attachments) {
                const parsedAttachments = new Attachments(VK)
                    .parse(repost.attachments as Attachment[], this.builders);

                this.attachAttachments(parsedAttachments, "repost");
            }
        }

        this.sliceMessage();
    }

    private attachAttachments(attachmentFields: AttachmentFields, type: AttachmentFieldsType) {
        const { builders: [builder] } = this;

        switch (type) {
            case "post":
                attachmentFields = attachmentFields.slice(0, 24);

                attachmentFields.forEach((attachmentField, index) => {
                    builder.addField(!index ? "Вложения" : "⠀", attachmentField);
                });
                break;
            case "repost":
                if (builder.fields.length) {
                    attachmentFields = attachmentFields.slice(0, (builder.fields.length ? 12 : 25) - 1);

                    builder.spliceFields(-1,
                        builder.fields.length >= 25 ?
                            12
                            :
                            0
                    );
                }

                attachmentFields.forEach((attachmentField, index) => {
                    builder.addField(!index ? "Вложения репоста" : "⠀", attachmentField);
                });
                break;
        }
    }

    private sliceMessage(): void {
        const { post, repost } = this;

        if ((post + repost).length > 2048) {
            if (post) {
                this.post = this.sliceFix(`${post.slice(0, (repost ? 1024 : 2048) - 3)}…\n`);
            }

            if (repost) {
                this.repost = this.sliceFix(`${repost.slice(0, (post ? 1024 : 2048) - 1)}…`);
            }
        }
    }

    protected sliceFix(text: string): string {
        return text.replace(/\[([^\])]+)?]?\(?([^()\]\[]+)?…/g, "$1…");
    }
}
