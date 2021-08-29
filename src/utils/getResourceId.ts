import { VK, db, DBSchema } from '../modules';

// eslint-disable-next-line require-await
export async function getResourceId(VK: VK, resource: string): Promise<number | null> {
    if (!(db.data as DBSchema)[resource]) {
        (db.data as DBSchema)[resource] = {};
    }

    const cache = (db.data as DBSchema)[resource];

    if (cache?.id) {
        return cache.id;
    }

    return VK.resolveResource(resource)
        .then(({ id, type }) => type === 'user' ?
            id
            :
            type === 'group' ?
                -id
                :
                null)
        .then((id) => {
            (db.data as DBSchema)[resource].id = id as number;

            db.write();

            return id;
        })
        .catch((error) => {
            console.error('[!] Произошла ошибка при получении ID-ресурса.');
            console.error(error);

            return null;
        });
}