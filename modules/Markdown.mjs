export class Markdown {

    constructor(VK) {
        this.VK = VK;
    }

    fixLinks(text) {
        return text.replace(/(?:\[(https:\/\/vk.com\/[^]+?)\|([^]+?)])/g, "[$2]($1)")
                   .replace(/(?:\[([^]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)");
    }

    async fixMarkdown(text) {
        const { VK } = this;
        const { snippets } = VK;

        let fixedText = text;

        const hashtagRegExp = /#([^\s]+)@([a-zA-Z_]+)/g;

        const hashtags = hashtagRegExp.exec(text);

        fixedText = fixedText
            .replace(/#([^\s]+)/g, (match, p1) => {
                if (match.match(hashtagRegExp)) return match;

                return `[#${p1}](https://vk.com/feed?section=search&q=%23${p1})`;
            });

        if (hashtags) {
            const [, , group] = hashtags;

            const resource = await snippets.resolveResource(group)
                .catch(() => null);

            if (resource && resource.type === "group") {
                fixedText = text.replace(hashtagRegExp, (match, p1, p2) => {
                    if (p1.match(/[a-zA-Z]+/)) return `[#${p1}@${p2}](https://vk.com/${p2}/${p1})`;

                    return `[#${p1}@${p2}](https://vk.com/wall-${resource.id}?q=%23${p1})`;
                });
            }
        }

        try {
            return decodeURI(fixedText);
        } catch {
            return fixedText;
        }
    }
}
