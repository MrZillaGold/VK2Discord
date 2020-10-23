import { Markdown } from "./Markdown.mjs";
import { Attachments } from "./Attachments.mjs";

export class Message {

    async parseText(payload) {
        const { VK } = this.config;

        const [builder] = this.builders;

        if (payload.text) {
            this.message.post += `${
                await new Markdown(payload.text, VK)
                    .fix()
            }\n`;
        }

        if (payload.attachments) {
            const parsedAttachments = new Attachments(payload.attachments).parse(this.builders);

            if (parsedAttachments) {
                builder.addField("Вложения", parsedAttachments);
            }
        }

        const Repost = payload.copy_history ? payload.copy_history[0] : null;

        if (Repost) {
            this.message.repost +=
                `\n\n>>> [**Репост записи**](https://vk.com/wall${Repost.from_id}_${Repost.id})\n\n`;

            if (Repost.text) {
                this.message.repost += `${
                    await new Markdown(Repost.text, VK)
                        .fix()
                }`;
            }

            if (Repost.attachments) {
                const parsedAttachments = new Attachments(Repost.attachments).parse(this.builders);

                if (parsedAttachments) {
                    builder.addField("Вложения репоста", parsedAttachments);
                }
            }
        }

        this.sliceMessage();
    }

    sliceMessage() {
        const { post, repost } = this.message;

        if ((post + repost).length > 2048) {
            if (post) {
                this.message.post = `${post.slice(0, repost ? 1021 : 2045)}…\n`;
            }

            if (repost) {
                this.message.repost = `${repost.slice(0, post ? 1021 : 2047)}…`;
            }
        }
    }
}
