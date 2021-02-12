export class Keywords {

    readonly keywords: string[];

    constructor(keywords: string[]) {
        this.keywords = keywords;
    }

    check(text: string): boolean {
        const { keywords } = this;

        if (keywords.length && text) {
            return keywords.some((keyword) => {
                return text.match(
                    new RegExp(keyword, "gi")
                );
            });
        } else {
            return true;
        }
    }
}
