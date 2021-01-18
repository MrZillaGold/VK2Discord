import { IResolvedOwnerResource, IResolvedTargetResource } from "vk-io";
import replaceAsync from "string-replace-async";

import { VK } from "./VK.js";

export class Markdown {

    VK: VK;

    constructor(VK: VK) {
        this.VK = VK;
    }

    async fix(text: string): Promise<string> {
        text = text // Fix ссылок
            .replace(/(?:\[(https:\/\/vk.com\/[^]+?)\|([^]+?)])/g, "[$2]($1)")
            .replace(/(?:\[([^[]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)");

        text = await replaceAsync(text, /(?:^|\s)#([^\s]+)/g, async (match, hashtag): Promise<string> => { // Fix хештегов
            const space: string = match.startsWith("\n") ? "\n" : match.startsWith(" ") ? " " : "";

            const isNavigationHashtag: RegExpMatchArray | null = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

            if (isNavigationHashtag) {
                const [, hashtag, group] = isNavigationHashtag;

                const resource: IResolvedTargetResource | IResolvedOwnerResource | null = await this.VK.resolveResource(group)
                    .catch(() => null);

                if (resource?.type === "group") {
                    if (hashtag.match(/[a-zA-Z]+/)) {
                        return `${space}[#${hashtag}@${group}](https://vk.com/${group}/${hashtag})`;
                    }

                    return `${space}[#${hashtag}@${group}](https://vk.com/wall-${resource.id}?q=%23${hashtag})`;
                }
            }

            return `${space}[#${hashtag}](https://vk.com/feed?section=search&q=%23${hashtag})`;
        });

        try {
            return decodeURI(text);
        } catch {
            return text;
        }
    }

    sliceFix(text: string): string {
        return text.replace(/\[([^\]\)]+)?\]?\(?([^\(\)\]\[]+)?…/g, "$1…");
    }
}
