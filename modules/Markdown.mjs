import VKIO from "vk-io";
import replaceAsync from "string-replace-async";

const { resolveResource } = VKIO;

export class Markdown {

    constructor(text, VK) {
        this.text = text;

        this.VK = VK;
    }

    async fix() {
        const { api } = this.VK;

        let fixed = this.text;

        fixed = fixed
            .replace(/(?:\[(https:\/\/vk.com\/[^]+?)\|([^]+?)])/g, "[$2]($1)")
            .replace(/(?:\[([^[]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)"); // Fix ссылок

        fixed = await replaceAsync(fixed, /(?:^|\s)#([^\s]+)/g, async (match, hashtag) => { // Fix хештегов
            const space = match.startsWith("\n") ? "\n" : match.startsWith(" ") ? " " : "";

            const isNavigationHashtag = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

            if (isNavigationHashtag) {
                const [, hashtag, group] = isNavigationHashtag;

                const resource = await resolveResource({
                    resource: group,
                    api
                })
                    .catch(() => null);

                if (resource && resource.type === "group") {
                    if (hashtag.match(/[a-zA-Z]+/)) {
                        return `${space}[#${hashtag}@${group}](https://vk.com/${group}/${hashtag})`;
                    }

                    return `${space}[#${hashtag}@${group}](https://vk.com/wall-${resource.id}?q=%23${hashtag})`;
                }
            }

            return `${space}[#${hashtag}](https://vk.com/feed?section=search&q=%23${hashtag})`;
        });

        try {
            return decodeURI(fixed);
        } catch {
            return fixed;
        }
    }
}
