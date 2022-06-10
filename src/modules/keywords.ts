export interface IKeywordOptions {
    keywords: string[];
    type: KeywordsType;
}

export enum KeywordsType {
    KEYWORDS = 'keywords',
    BLACKLIST = 'blacklist'
}

export class Keywords {

    readonly #keywords: IKeywordOptions['keywords'];
    readonly #type: IKeywordOptions['type'];

    constructor({ keywords, type }: IKeywordOptions) {
        this.#keywords = keywords;
        this.#type = type;
    }

    check(text: string | void): boolean {
        if (this.#keywords.length) {
            if (text) {
                const match = this.#keywords.some((keyword) => (
                    text.match(
                        new RegExp(keyword, 'gi')
                    )
                ));

                return this.#reverse(match);
            }

            return this.#reverse(false);
        }

        return true;
    }

    #reverse(value: boolean) {
        return this.#type === KeywordsType.KEYWORDS ?
            value
            :
            !value;
    }
}
