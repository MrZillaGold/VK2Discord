import { MessageEmbed } from "discord.js";
import { IWallAttachmentPayload } from "vk-io";

import { Markdown } from "./Markdown.js";
import { Attachments } from "./Attachments.js";

import { Attachment, AttachmentFields, AttachmentFieldType, ICluster } from "../interfaces";

export class Message {

    readonly cluster: ICluster;

    protected post = "";
    protected repost = "";

    builders: MessageEmbed[];

    constructor(cluster: ICluster) {
        this.cluster = cluster;

        const color = cluster.discord.color;
        this.builders = [
            new MessageEmbed()
                .setColor(color.match(/^#(?:\w{3}|\w{6})$/) ? color : "#aabbcc")
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

        const repost = payload.copy_history ? payload.copy_history[0] : null;

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

    private attachAttachments(attachmentFields: AttachmentFields, type: AttachmentFieldType) {
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
                            0);
                }

                attachmentFields.forEach((attachmentField, index) => {
                    builder.addField(!index ? "Вложения репоста" : "⠀", attachmentField);
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
        return text.replace(/\[([^\])]+)?]?\(?([^()\][]+)?…/g, "$1…");
    }
}
