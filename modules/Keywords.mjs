export class Keywords {

    constructor(keywords) {
        this.keywords = keywords;
    }

    check(text) {
        const { keywords } = this;

        if (keywords.length > 0 && text) {
            return keywords.some(keyword => {
                return text.match(
                    new RegExp(keyword, "gi")
                );
            });
        } else {
            return true;
        }
    }
}
