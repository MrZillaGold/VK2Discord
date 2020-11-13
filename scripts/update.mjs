import fs from "fs";

import config from "../config.json";
import scriptPackage from "../package.json";

const { LATEST_CONFIG_VERSION } = scriptPackage;
const { clusters, version_dont_modify_me } = config;

// Изменения версий фиксируются в массивах

const changes = new Map([
    [
        2,                          // Версия
        [                           // Добавления
            {},                     // VK
            {                       // Discord
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
    ],
    [
        4,
        [
            {
                donut: false,
                ads: false,
                words_blacklist: []
            },
            {}
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
