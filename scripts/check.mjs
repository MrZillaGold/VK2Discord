import { promises as fs } from "fs";

import scriptPackage from "../package.json";

const { LATEST_CONFIG_VERSION } = scriptPackage;

fs.readdir("./")
    .then(async (files) => {
        if (files.includes("config.json")) {
            try {
                const config = await import("../config.json");

                if (config.default.version_dont_modify_me !== LATEST_CONFIG_VERSION) {
                    await rename();
                    await createConfig();

                    console.error("\n\n[!] Версия конфига не соответствует текущей, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции, либо примените обновления для конфига при помощи скрипта npm run update.\n\n");

                    process.exit(-1);
                }
            } catch {
                await rename();
                await createConfig();

                console.error("\n\n[!] Конфиг поврежден либо настроен неправильно, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции.\n\n");

                process.exit(-1);
            }
        } else {
            await createConfig();

            console.warn("\n\n[!] Конфиг в папке со скриптом не обнаружен, создан новый файл с конфигом. Настройте его следуя инструкции.\n\n");

            process.exit(-1);
        }

        if (files.includes("news.json")) {
            try {
                await import("../news.json");
            } catch {
                await createNews();
            }
        } else {
            await createNews();
        }
    })
    .catch((error) => {
        console.warn("[!] Ошибка при получении файлов из папки со скриптом. Проверить наличие конфига не удастся.");
        console.error(error);
    });

function createConfig() {
    const config = {
        clusters: [
            {
                vk: {
                    token: "Токен от станицы или группы ВКонтакте",
                    group_id: "club1",
                    keywords: [],
                    words_blacklist: [],
                    filter: true,
                    donut: false,
                    ads: false,
                    longpoll: false,
                    interval: 30
                },
                discord: {
                    webhook_urls: [
                        "https://discordapp.com/api/webhooks/"
                    ],
                    username: "",
                    avatar_url: "",
                    content: "",
                    color: "#aabbcc",
                    author: true,
                    copyright: true
                }
            }
        ],
        version_dont_modify_me: LATEST_CONFIG_VERSION
    };

    return fs.writeFile("./config.json", JSON.stringify(config, null, "\t"));
}

function rename() {
    return fs.rename("./config.json", "./config_old.json");
}

function createNews() {
    return fs.writeFile("./news.json", JSON.stringify({}, null, "\t"));
}
