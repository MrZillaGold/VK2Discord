const path = require("path");
const fs = require("fs");

fs.readdir(path.join(__dirname), (error, files) => {

    if (error) {
        return console.log("[!] Ошибка при получении файлов из папки со скриптом. Проверить наличие конфига не удастся.");
    }

    if (files.includes("config.json")) {
        try {
            const config = require("./config");

            if (config.version_dont_modify_me !== 1) {
                rename();

                createConfig();

                console.log("[!] Версия конфига не соответствует текущей, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции.");

                process.exit(-1);
            }
        } catch {
            rename();

            createConfig();

            console.log("[!] Конфиг поврежден либо настроен неправильно, файл был переименован в config_old.json. Новый файл с конфигом был создан, настройте его следуя инструкции.");

            process.exit(-1);
        }
    } else {
        createConfig();

        console.log("[!] Конфиг в папке со скриптом не обнаружен, создан новый файл с конфигом. Настройте его следуя инструкции.");

        process.exit(-1);
    }

    if (files.includes("news.json")) {
        try {
            require("./news");
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
                        "https://discordapp.com/api/webhooks/",
                        "https://discordapp.com/api/webhooks/"
                    ],
                    bot_name: "VK2DISCORD",
                    color: "#aabbcc"
                }
            }
        ],
        version_dont_modify_me: 1
    };

    fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));
}

function rename() {
    fs.renameSync("./config.json", "./config_old.json");
}

function createNews() {
    fs.writeFileSync("./news.json", JSON.stringify({}, null, "\t"));
}
