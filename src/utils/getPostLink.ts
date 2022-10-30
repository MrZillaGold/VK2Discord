export interface IGetPostLinkOptions {
    owner_id?: number;
    id?: number;
}

export const LINK_PREFIX = 'https://vk.ru/';

export function getPostLink({ owner_id, id }: IGetPostLinkOptions): string {
    return `${LINK_PREFIX}wall${owner_id}_${id}`;
}
