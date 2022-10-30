import { FieldType, Storage, VK } from '../modules/index.js';

export async function getResourceId(vk: VK, resource: string): Promise<number | null> {
    const storage = new Storage({
        vk,
        prefix: resource
    });

    const cacheKey = `${resource}-id`;
    const cachedId = await storage.get(cacheKey, FieldType.NUMBER);

    if (cachedId) {
        return cachedId;
    }

    return vk.resolveResource(resource)
        .then(({ id, type }) => (
            type === 'user' ?
                id
                :
                type === 'group' ?
                    -id
                    :
                    null
        ))
        .then((id) => {
            storage.set(cacheKey, id);

            return id;
        })
        .catch((error) => {
            console.error('[!] Произошла ошибка при получении ID-ресурса.');
            console.error(error);

            return null;
        });
}
