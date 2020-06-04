import VKIO from "vk-io";

import webhook from "webhook-discord";

import { Sender } from "./sender";
import { notify } from "./functions";

const { VK } = VKIO;

export class Handler {

    cluster = {};

    VKIO = new VK();

    setCluster(cluster) {
        this.cluster = cluster;
    }

    init() {
        const VKIO = this.VKIO;

        const { vk } = this.cluster;
        const { longpoll, token } = vk;

        VKIO.setOptions({
            token,
            apiMode: "parallel"
        });

        if (!longpoll) {
            this.startInterval();
        } else {
            this.startLongPoll();
        }
    }

    startInterval() {
        const { api } = this.VKIO;

        const { vk, index } = this.cluster;
        const { interval, group_id, filter } = vk;

        console.log(`[VK2DISCORD] Кластер #${index} будет проверять новые записи с интервалом в ${interval} секунд.`);
        if (interval < 30) console.log("[!] Не рекомендуем ставить интервал получения постов меньше 30 секунд, во избежания лимитов ВКонтакте!");

        setInterval(() => {
            const sender = new Sender();

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
                v: "5.103"
            })
                .then(data => {
                    const builder = new webhook.MessageBuilder();

                    if (data.groups.length > 0 && (groupIdMatch || !userIdMatch)) { // Устанавливаем footer от типа отправителя записи
                        builder.setFooter(data.groups[0].name, data.groups[0].photo_50);
                    } else if (data.profiles.length > 0) {
                        builder.setFooter(`${data.profiles[0].first_name} ${data.profiles[0].last_name}`, data.profiles[0].photo_50);
                    }

                    const posts = data.items; // Проверяем наличие закрепа, если он есть берем свежую запись
                    const [post1, post2] = posts;

                    if (posts.length > 0) {
                        const postData = posts.length === 2 && post2.date > post1.date ? post2 : post1;

                        this.setSenderOptions(sender);

                        return sender.post(builder, postData);
                    } else {
                        console.log("[!] Не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.");
                    }

                })
                .catch(error => notify(error));
        }, interval * 1000);
    }

    async startLongPoll() {
        const { index } = this.cluster;

        const { updates, api } = this.VKIO;


        const [{ photo_50, name }] = await api.groups.getById();

        updates.on("new_wall_post", context => {
            const { wall } = context;

            const sender = new Sender();
            const builder = new webhook.MessageBuilder();

            this.setSenderOptions(sender);

            builder.setFooter(name, photo_50);

            if (wall.postType === "post") return sender.post(builder, wall);
        });

        updates.start()
            .then(() => console.log(`[VK2DISCORD] Кластер #${index} подключен к ВКонтакте с использованием LongPoll!`))
            .catch(error => notify(error));
    }

    setSenderOptions(sender) {
        const cluster = this.cluster;
        const VKIO = this.VKIO;

        sender.setOptions({
            ...cluster,
            VKIO
        });
    }
}
