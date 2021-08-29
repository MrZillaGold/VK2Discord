import { IWallPostContextPayload } from 'vk-io';
import { GroupsGroupFull, GroupsProfileItem } from 'vk-io/lib/api/schemas/objects';

export interface IProfile {
    name: string;
    photo_50?: string;
}

export function getPostAuthor(post: IWallPostContextPayload, profiles: GroupsProfileItem[], groups: GroupsGroupFull[]): IProfile | GroupsGroupFull {
    const author: (GroupsProfileItem | GroupsGroupFull)[] =
        post.from_id as number > 0 ?
            profiles.filter(({ id }) => id === post.from_id)
            :
            groups.filter(({ id }) => id === Math.abs(post.from_id as number));

    return author.map((profile: GroupsProfileItem | GroupsGroupFull) => {
        const { name, photo_50, first_name, last_name } = profile;

        if (name) {
            return profile as GroupsGroupFull;
        } else {
            return {
                name: `${first_name} ${last_name}`,
                photo_50
            } as IProfile;
        }
    })[0];
}