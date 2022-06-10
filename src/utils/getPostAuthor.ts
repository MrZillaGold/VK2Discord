import { GroupsGroupFull, UsersUserFull, WallWallpostFull } from 'vk-io/lib/api/schemas/objects';

export interface IProfile {
    name: string;
    photo_50?: string;
}

export function getPostAuthor(post: WallWallpostFull, profiles: UsersUserFull[], groups: GroupsGroupFull[]): IProfile | GroupsGroupFull {
    const author: (UsersUserFull | GroupsGroupFull)[] =
        post.from_id as number > 0 ?
            profiles.filter(({ id }) => id === post.from_id)
            :
            groups.filter(({ id }) => id === Math.abs(post.from_id as number));

    return author.map((profile: UsersUserFull | GroupsGroupFull) => {
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
