import { updates, api, longpoll, groupId, interval, filter } from "./vk";

import { webhook } from "./discord";

import { Sender } from "./sender";

if (!longpoll) {
    if (interval < 30000) console.log("[!] Не рекомендуем ставить интервал получения постов меньше 30 секунд, во избежания лимитов ВКонтакте!");

    setInterval(() => {
        const sender = new Sender();

        const groupIdMatch = groupId.match(/^(?:public|club)([\d]+)$/);
        const userIdMatch = groupId.match(/^id([\d]+)$/);
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
                    domain: groupId
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
                const post1 = posts[0];
                const post2 = posts[1];

                if (posts.length > 0) {
                    const postData = posts.length === 2 && post2.date > post1.date ? post2 : post1;

                    sender.Post(builder, postData);
                } else {
                    console.log("[!] Не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.");
                }

            })
            .catch(err => errorHandler(err));
    }, interval);
} else {
    updates.on("new_wall_post", context => {
        const sender = new Sender();

        sender.Post(new webhook.MessageBuilder(), context.wall)
    });

    updates.start()
        .then(() => console.log("[VK2DISCORD] Подключен к ВКонтакте!"))
        .catch(err => errorHandler(err));
}

console.log("[VK2DISCORD] Запущен.");

function errorHandler(error) {
    console.log(`[!] Возникла ошибка: ${error}. Если не понимаете в чем причина, свяжитесь со мной: https://vk.com/id233731786`);
}

export {
    errorHandler
};
