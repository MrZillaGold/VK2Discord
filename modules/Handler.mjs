import VKIO from "vk-io";

import { Sender } from "./Sender.mjs";

const { VK } = VKIO;

export class Handler {

    constructor(cluster) {
        this.cluster = cluster;
    }

    init() {
        const { vk } = this.cluster;
        const { longpoll, token } = vk;

        this.VK = new VK({
            token,
            apiMode: "parallel"
        });

        if (!longpoll) {
            this.startInterval();
        } else {
            this.startPolling();
        }
    }

    startInterval() {
        const { vk, discord, index } = this.cluster;
        const { interval, group_id, filter } = vk;
        const { author, copyright } = discord;

        console.log(`[VK2Discord] Кластер #${index} будет проверять новые записи с интервалом в ${interval} секунд.`);

        if (interval < 30) {
            console.warn("[!] Не рекомендуем ставить интервал получения постов меньше 30 секунд, во избежания лимитов ВКонтакте!");
        }

        setInterval(() => {
            const sender = this.createSender();

            const groupIdMatch = group_id.match(/^(?:public|club)([\d]+)$/);
            const userIdMatch = group_id.match(/^id([\d]+)$/);
            const id = groupIdMatch ?
                {
                    owner_id: -groupIdMatch[1]
                }
                :
                userIdMatch ?
                    {
                        owner_id: userIdMatch[1]
                    }
                    :
                    {
                        domain: group_id
                    };

            const [builder] = sender.builders;

            this.VK.api.wall.get({
                ...id,
                count: 2,
                extended: 1,
                filter: filter ? "owner" : "all",
                v: "5.122"
            })
                .then(async ({ groups, profiles, items }) => {
                    if (items.length) {
                        // Проверяем наличие закрепа, если он есть берем свежую запись
                        const post = items.length === 2 ? items[0].date > items[1].date ? items[0] : items[1] : items[0];

                        const link = this.getPostLink(post);

                        // Устанавливаем автора от типа отправителя записи
                        if (author) {
                            if (post.owner_id === post.from_id) {
                                const [{ name, photo_50 }] = (post.from_id > 0 ?
                                    profiles.filter(({ id }) => id === post.owner_id)
                                    :
                                    groups.filter(({ id }) => id === Math.abs(post.owner_id)))
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

                                builder.setAuthor(name, photo_50, link);
                            } else {
                                const [{ first_name, last_name, photo_50 }] = profiles.filter(({ id }) => id === post.from_id);

                                builder.setAuthor(`${first_name} ${last_name}`, photo_50, link);
                            }
                        }

                        if (copyright) {
                            await this.setCopyright(post, builder);
                        }

                        return sender.handle(post);
                    } else {
                        console.log("[!] Не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.");
                    }

                })
                .catch(console.log);
        }, interval * 1000);
    }

    async startPolling() {
        const { index, discord: { author, copyright } } = this.cluster;

        this.VK.updates.on("wall_post_new", async (context) => {

            const { payload } = context;

            if (payload.post_type === "post") {
                const sender = this.createSender();

                const [builder] = sender.builders;

                if (author) {
                    const { photo_50, name } = await this.getById(payload.from_id);

                    builder.setAuthor(name, photo_50, this.getPostLink(payload));
                }

                if (copyright) {
                    await this.setCopyright(payload, builder);
                }

                return sender.handle(payload);
            }
        });

        this.VK.updates.start()
            .then(() =>
                console.log(`[VK2Discord] Кластер #${index} подключен к ВКонтакте с использованием LongPoll!`)
            )
            .catch(console.log);
    }

    createSender() {
        const cluster = this.cluster;
        const VK = this.VK;

        return new Sender({
            ...cluster,
            VK
        });
    }

    getPostLink({ owner_id, id }) {
        return `https://vk.com/wall${owner_id}_${id}`;
    }

    async setCopyright({ copyright }, builder) {
        if (copyright) {
            const group = copyright.id ? await this.getById(copyright.id) : null;

            builder.setFooter(`Источник: ${copyright.name}`, group && group.photo_50); // Вскоре заменить на nullable оператор, при этом теряя поддержку node < 14
        }
    }

    async getById(id) {
        return id > 0 ?
            await this.VK.api.users.get({
                user_ids: id,
                fields: "photo_50"
            })
                .then(([{ first_name, last_name, ...user }]) => ({
                    name: `${first_name} ${last_name}`,
                    ...user
                }))
            :
            await this.VK.api.groups.getById({
                group_id: Math.abs(id)
            })
                .then(([group]) => group);
    }
}
