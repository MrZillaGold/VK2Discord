import path, { dirname } from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LATEST_CONFIG_VERSION = 3;

fs.readdir(path.join(__dirname), async (error, files) => {

    if (error) {
        return console.warn("[!] Ошибка при получении файлов из папки со скриптом. Проверить наличие конфига не удастся.");
    }

    if (files.includes("config.json")) {
        try {
            const config = await import("./config");

            if (config.default.version_dont_modify_me !== LATEST_CONFIG_VERSION) {
                rename();

                createConfig();

                console.error("\n\n[!] Версия конфига не соответствует текущей, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции, либо примените обновления для конфига при помощи скрипта npm run update.\n\n");

                process.exit(-1);
            }
        } catch {
            rename();

            createConfig();

            console.error("\n\n[!] Конфиг поврежден либо настроен неправильно, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции.\n\n");

            process.exit(-1);
        }
    } else {
        createConfig();

        console.warn("\n\n[!] Конфиг в папке со скриптом не обнаружен, создан новый файл с конфигом. Настройте его следуя инструкции.\n\n");

        process.exit(-1);
    }

    if (files.includes("news.json")) {
        try {
            await import("./news");
        } catch {
            createNews();
        }
    } else {
        createNews();
    }
});

function createConfig() {
    const config = {
        clusters: [
            {
                vk: {
                    token: "Токен от станицы или группы ВКонтакте",
                    group_id: "club1",
                    keywords: [],
                    filter: true,
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

    fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));
}

function rename() {
    fs.renameSync("./config.json", "./config_old.json");
}

function createNews() {
    fs.writeFileSync("./news.json", JSON.stringify({}, null, "\t"));
}
