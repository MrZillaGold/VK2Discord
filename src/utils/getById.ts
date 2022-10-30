import { API } from 'vk-io';
import { GroupsGroupFull } from 'vk-io/lib/api/schemas/objects';

import { IProfile } from './getPostAuthor.js';

export function getById(api: API, id?: number): Promise<IProfile | GroupsGroupFull | null> {
    return id ?
        id > 0 ?
            api.users.get({
                // @ts-ignore
                user_ids: String(id),
                fields: ['photo_50']
            })
                .then(([{ first_name, last_name, photo_50 }]) => ({
                    name: `${first_name} ${last_name}`,
                    photo_50
                }))
            :
            api.groups.getById({
                group_id: String(Math.abs(id))
            })
                .then(([group]) => group)
        :
        Promise.resolve(null);
}
