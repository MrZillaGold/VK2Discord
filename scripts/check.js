import { promises as fs } from 'fs';

import { LATEST_CONFIG_VERSION, NODE_MAJOR_VERSION, ENGINE_SUPPORT_VERSION } from './constants.js';

if (NODE_MAJOR_VERSION < ENGINE_SUPPORT_VERSION) {
    throw `\n\n[!] Для запуска скрипта необходим Node.js ${ENGINE_SUPPORT_VERSION} или выше!\n\n`;
}

const files = await fs.readdir('./')
    .catch((error) => {
        console.warn('[!] Ошибка при получении файлов из папки со скриптом. Проверить наличие конфига не удастся.');
        console.error(error);

        return null;
    });

if (files) {
    if (files.includes('config.json')) {
        await import('../config.json', { assert: { type: 'json' } })
            .then(async ({ default: { version_dont_modify_me } }) => {
                if (version_dont_modify_me !== LATEST_CONFIG_VERSION) {
                    await rename();
                    await createConfig();

                    console.error('\n\n[!] Версия конфига не соответствует текущей, файл был переименован в config_old.json. Был создан новый файл, настройте его следуя инструкции либо примените обновление при помощи скрипта npm run update.\n\n');

                    process.exit(-1);
                }
            })
            .catch(async (error) => {
                console.log(error);
                await rename();
                await createConfig();

                console.error('\n\n[!] Конфиг поврежден либо настроен неправильно, файл был переименован в config_old.json. Был создан новый файл, настройте его следуя инструкции.\n\n');

                process.exit(-1);
            });
    } else {
        await createConfig();

        console.warn('\n\n[!] Конфиг в папке со скриптом не обнаружен, создан новый файл. Настройте его следуя инструкции.\n\n');

        process.exit(-1);
    }
}

function createConfig() {
    const config = {
        clusters: [
            {
                vk: {
                    token: 'Токен от станицы или группы ВКонтакте',
                    group_id: 'club1',
                    keywords: [],
                    words_blacklist: [],
                    filter: true,
                    donut: false,
                    ads: false,
                    interval: 30
                },
                discord: {
                    webhook_urls: [
                        'https://discordapp.com/api/webhooks/'
                    ],
                    username: '',
                    avatar_url: '',
                    content: '',
                    color: '#aabbcc',
                    author: true,
                    copyright: true,
                    date: true,
                    exclude_content: []
                }
            }
        ],
        version_dont_modify_me: LATEST_CONFIG_VERSION
    };

    return fs.writeFile('./config.json', JSON.stringify(config, null, '\t'));
}

function rename() {
    return fs.rename('./config.json', './config_old.json');
}
