export class Markdown {

    constructor(text) {
        this.text = text;
    }

    fix() {
        let fixed = this.text;

        fixed = fixed
            .replace(/(?:\[(https:\/\/vk.com\/[^]+?)\|([^]+?)])/g, "[$2]($1)")
            .replace(/(?:\[([^]+?)\|([^]+?)])/g, "[$2](https://vk.com/$1)"); // Fix ссылок

        fixed = fixed.replace(/(?:^|\s)#([^\s]+)/g, (match, hashtag) => { // Fix хештегов
            const space = match.startsWith(" ") ? " " : "";

            const isNavigationHashtag = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

            if (isNavigationHashtag) {
                const [, hashtag, group] = isNavigationHashtag;

                return `${space}[#${hashtag}@${group}](https://vk.com/${group}/${hashtag})`;
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
