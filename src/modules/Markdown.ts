import replaceAsync from 'string-replace-async';

import { VK } from './VK';

import { LINK_PREFIX } from '../utils';

export class Markdown {

    readonly VK: VK;

    constructor(VK: VK) {
        this.VK = VK;
    }

    async fix(text: string): Promise<string> {
        // Fix ссылок
        text = text.replace(/\[([^[]+?)\|([^]+?)]/g, (match, link, title) => (
            `[${title}](${!link.startsWith(LINK_PREFIX) ? LINK_PREFIX : ''}${link})`
        ));

        // Fix хештегов
        text = await replaceAsync(text, /(?:^|\s)#([^\s]+)/g, async (match, hashtag): Promise<string> => {
            const space = match.startsWith('\n') ?
                '\n'
                :
                match.startsWith(' ') ?
                    ' '
                    :
                    '';

            const isNavigationHashtag = match.match(/#([^\s]+)@([a-zA-Z_]+)/);

            if (isNavigationHashtag) {
                const [, hashtag, group] = isNavigationHashtag;

                const resource = await this.VK.resolveResource(group)
                    .catch(() => null);

                if (resource?.type === 'group') {
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
}
