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
        const { api } = this.VK;

        const { vk, index } = this.cluster;
        const { interval, group_id, filter } = vk;

        console.log(`[VK2Discord] Кластер #${index} будет проверять новые записи с интервалом в ${interval} секунд.`);

        if (interval < 30) {
            console.log("[!] Не рекомендуем ставить интервал получения постов меньше 30 секунд, во избежания лимитов ВКонтакте!");
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

            api.wall.get({
                ...id,
                count: 2,
                extended: 1,
                filter: filter ? "owner" : "all",
                v: "5.122"
            })
                .then(({ groups, profiles, items }) => {

                    if (groups.length && (groupIdMatch || !userIdMatch)) { // Устанавливаем footer от типа отправителя записи
                        const [{ name, photo_50 }] = groups;

                        sender.builder.setFooter(name, photo_50);
                    } else if (profiles.length) {
                        const [{ first_name, last_name, photo_50 }] = profiles;

                        sender.builder.setFooter(`${first_name} ${last_name}`, photo_50);
                    }

                    const [post1, post2] = items;

                    if (items.length) { // Проверяем наличие закрепа, если он есть берем свежую запись
                        const post = items.length === 2 && post2.date > post1.date ? post2 : post1;

                        return sender.post(post);
                    } else {
                        console.log("[!] Не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.");
                    }

                })
                .catch(console.log);
        }, interval * 1000);
    }

    async startPolling() {
        const { index } = this.cluster;

        const { updates, api } = this.VK;

        const [{ photo_50, name }] = await api.groups.getById();

        updates.on("wall_post_new", context => {

            const { payload } = context;

            const sender = this.createSender();

            sender.builder.setFooter(name, photo_50);

            if (payload.post_type === "post") {
                return sender.post(payload);
            }
        });

        updates.start()
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
}
