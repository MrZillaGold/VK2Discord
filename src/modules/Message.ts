import { MessageEmbed } from "discord.js";
import { IWallAttachmentPayload } from "vk-io";

import { Markdown } from "./Markdown.js";
import { Attachments } from "./Attachments.js";

import { Attachment, Cluster } from "../interfaces";

export class Message {

    cluster: Cluster;

    post: string;
    repost: string;

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

    async parsePost(payload: IWallAttachmentPayload): Promise<void> {
        const { cluster: { VK }, builders: [builder] } = this;

        if (payload.text) {
            this.post += `${
                await new Markdown(VK)
                    .fix(payload.text)
            }\n`;
        }

        if (payload.attachments) {
            const parsedAttachments = new Attachments()
                .parse(payload.attachments as Attachment[], this.builders);

            if (parsedAttachments) {
                builder.addField("Вложения", parsedAttachments);
            }
        }

        const repost: IWallAttachmentPayload | null = payload.copy_history ? payload.copy_history[0] : null;

        if (repost) {
            this.repost += `\n>>> [**Репост записи**](https://vk.com/wall${repost.from_id}_${repost.id})`;

            if (repost.text) {
                this.repost += `${
                    await new Markdown(VK)
                        .fix(repost.text)
                }`;
            }

            if (repost.attachments) {
                const parsedAttachments = new Attachments()
                    .parse(repost.attachments as Attachment[], this.builders);

                if (parsedAttachments) {
                    builder.addField("Вложения репоста", parsedAttachments);
                }
            }
        }

        this.sliceMessage();
    }

    sliceMessage(): void {
        const { post, repost } = this;

        if ((post + repost).length > 2048) {
            if (post) {
                this.post = `${post.slice(0, repost ? 1021 : 2045)}…\n`;
            }

            if (repost) {
                this.repost = `${repost.slice(0, post ? 1021 : 2047)}…`;
            }
        }
    }
}
