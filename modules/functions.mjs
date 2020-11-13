import VKIO from "vk-io";

const { resolveResource } = VKIO;

export function getResourceId(api, resource) {
    return resolveResource({
        api,
        resource
    })
        .then(({ id, type }) =>
            type === "user" ?
                id
                :
                type === "group" ?
                    -id
                    :
                    null
        )
        .catch(() => null);
}

export function getPostLink({ owner_id, id }) {
    return `https://vk.com/wall${owner_id}_${id}`;
}

export function getPostAuthor(post, profiles, groups) {
    const [profile] = (
        post.from_id > 0 ?
            profiles.filter(({ id }) => id === post.from_id)
            :
            groups.filter(({ id }) => id === Math.abs(post.from_id))
    )
        .map((profile) => {

            const { name, photo_50, first_name, last_name } = profile;

            if (name) {
                return profile;
            } else {
                return {
                    name: `${first_name} ${last_name}`,
                    photo_50
                }
            }
        });

    return profile;
}

export function getById(api, id) {
    return id ?
        id > 0 ?
            api.users.get({
                user_ids: id,
                fields: "photo_50"
            })
                .then(([{ first_name, last_name, ...user }]) => ({
                    name: `${first_name} ${last_name}`,
                    ...user
                }))
            :
            api.groups.getById({
                group_id: Math.abs(id)
            })
                .then(([group]) => group)
        :
        null;
}
