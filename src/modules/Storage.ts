import { TokenType, VK } from './VK';

export interface IStorageOption {
    vk: VK;
    prefix?: string;
}

export enum FieldType {
    ARRAY_NUMBER = 'array_number',
    NUMBER = 'number'
}

export class Storage {

    static readonly cache = new Map<string, any>();
    static ARRAY_ITEMS_SEPARATOR = ',';
    static PREFIX = 'vk2d-';

    private vk: VK;
    prefix!: string;

    constructor({ vk, prefix }: IStorageOption) {
        this.vk = vk;

        if (prefix) {
            this.prefix = prefix;
        }
    }

    setPrefix(prefix: string): void {
        this.prefix = prefix;
    }

    get<T>(key: string, type: FieldType): Promise<T> {
        const cachedKey = this.buildCacheKey(key);
        const cachedValue = Storage.cache.get(cachedKey);

        if (cachedValue) {
            return Promise.resolve(cachedValue as T);
        }

        return this.vk.api.storage.get({
            key: this.buildPrefixedKey(key),
            user_id: this.userId
        })
            .then((values) => {
                const [{ value }] = values;

                switch (type) {
                    case FieldType.ARRAY_NUMBER: {
                        const values = value.split(Storage.ARRAY_ITEMS_SEPARATOR);

                        switch (type) {
                            case FieldType.ARRAY_NUMBER:
                                return values.map(Number);
                        }
                        break;
                    }
                    case FieldType.NUMBER:
                        return Number(value);
                    default:
                        return value;
                }
            }) as Promise<T>;
    }

    set(key: string, value?: any): Promise<void> {
        if (key.startsWith(Storage.PREFIX)) {
            key = key.replace(Storage.PREFIX, '');
        }

        const cachedKey = this.buildCacheKey(key);

        Storage.cache.set(cachedKey, value);

        if (value !== undefined) {
            if (Array.isArray(value)) {
                value = value.join(Storage.ARRAY_ITEMS_SEPARATOR);
            } else {
                value = String(value);
            }
        }

        return this.vk.api.storage.set({
            key: this.buildPrefixedKey(key),
            user_id: this.userId,
            value
        })
            .then();
    }

    getKeys(): Promise<string[]> {
        return this.vk.api.storage.getKeys({
            user_id: this.userId,
            count: 1_000
        });
    }

    private get userId(): number | undefined {
        return this.vk.tokenType !== TokenType.USER ?
            1
            :
            undefined;
    }

    private buildCacheKey(key: string): string {
        return `${this.prefix}-${key}`;
    }

    private buildPrefixedKey(key: string): string {
        return `${Storage.PREFIX}${key}`;
    }
}