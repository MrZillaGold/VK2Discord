import config from "./config.json";
import fs from "fs";

const LATEST_CONFIG_VERSION = 3;

const { clusters, version_dont_modify_me } = config;

// Изменения версий фиксируются в массивах
// 0 Индекс = объекту с новыми полями в объекте "vk"
// 1 Индекс = объекту с новыми полями в объекте "discord"

const changes = new Map([
    [
        2, // Версия
        [  // Добавления
            {},
            {
                author: true,
                copyright: true
            }
        ]
    ],
    [
        3,
        [
            {},
            {
                content: "",
                username: "",
                avatar_url: ""
            }
        ]
    ]
]);

if (!clusters || !version_dont_modify_me) {
    console.warn("[!] Структура вашего конфига больше не поддерживается скриптом, вам необходимо обновить конфиг вручную следуя инструкции.");
} else {
    if (version_dont_modify_me >= LATEST_CONFIG_VERSION) {
        console.log("[!] Текущая версия конфига последняя, обновление не требуется.");
    } else {
        config.clusters = clusters.map(({ vk, discord }) => {
            for (let version = version_dont_modify_me; version !== LATEST_CONFIG_VERSION; version++) {
                const [vkChanges, discordChanges] = changes.get(version + 1);

                vk = {
                    ...vk,
                    ...vkChanges
                };

                discord = {
                    ...discord,
                    ...discordChanges
                };
            }

            return {
                vk,
                discord
            }
        });

        config.version_dont_modify_me = LATEST_CONFIG_VERSION;

        fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));

        console.log("[VK2Discord] Конфиг обновлен до последней версии.");
    }
}
