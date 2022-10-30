import assert from 'assert';

import { LINK_PREFIX } from '../dist/utils/index.js';
import { Keywords, Markdown, Sender, VK, Storage, FieldType, TokenType } from '../dist/modules/index.js';

import payload from './payload.json' assert { type: 'json' };

const cluster = {
    vk: {
        keywords: [],
        words_blacklist: [],
        filter: false,
        donut: false,
        ads: false,
        group_id: 'test',
        longpoll: false
    },
    discord: {
        webhook_urls: [
            process.env.WEBHOOK
        ],
        username: 'CI',
        avatar_url: '',
        content: '',
        color: '#ffbbff',
        author: true,
        copyright: true,
        exclude_content: []
    }
};

const vk = new VK({
    token: process.env.TOKEN
});

vk.tokenType = TokenType.USER;

describe('Keywords', () => {
    describe('check();', () => {

        const keyword = ['вконтакте'];
        const keywords = ['VK2disCOrd', 'скРИпт'];
        const [text1, text2] = [
            'VK2Discord - скрипт для отправки постов из ВКонтакте в Discord с использованием WebHooks.',
            'Пройдите мимо нас и простите нам наше счастье.'
        ];

        it('Проверка текста на соответствие ключевым словам', () => {
            assert.ok(
                new Keywords({
                    type: 'keywords',
                    keywords
                })
                    .check(text1)
            );
        });

        it('Проверка текста на несоответствие ключевым словам', () => {
            assert.ok(
                new Keywords({
                    type: 'blacklist',
                    keywords: keyword
                })
                    .check(text2)
            );
        });

        it('Проверка функции на ошибки при отсутствии текста', () => {
            assert.doesNotThrow(() => {
                new Keywords({
                    keywords: []
                })
                    .check('');

                new Keywords({
                    keywords: []
                })
                    .check(null);
            });
        });
    });
});

describe('Markdown', () => {
    describe('fix();', () => {
        it('Проверка текста лишь с одним #хештегом', async () => {
            assert.deepStrictEqual(
                await new Markdown(vk)
                    .fix('#hashtag'),
                `[#hashtag](${LINK_PREFIX}feed?section=search&q=%23hashtag)`
            );
        });

        it('Проверка текста с одним #хештегом', async () => {
            assert.deepStrictEqual(
                await new Markdown(vk)
                    .fix('Очень длинный текст #hashtag'),
                `Очень длинный текст [#hashtag](${LINK_PREFIX}feed?section=search&q=%23hashtag)`
            );
        });

        it('Проверка текста с одним #хештегом и его переносом', async () => {
            assert.deepStrictEqual(
                await new Markdown(vk)
                    .fix('Очень длинный текст\n#hashtag'),
                `Очень длинный текст\n[#hashtag](${LINK_PREFIX}feed?section=search&q=%23hashtag)`
            );
        });

        if (process.env.TOKEN) {
            it('Проверка текста лишь с одним навигационным #хештегом', async () => {
                assert.deepStrictEqual(
                    await new Markdown(vk)
                        .fix('#test@stevebot'),
                    `[#test@stevebot](${LINK_PREFIX}stevebot/test)`
                );
            });

            it('Проверка текста лишь с одним навигационным #хештегом содержащим кириллицу', async () => {
                assert.deepStrictEqual(
                    await new Markdown(vk)
                        .fix('#тест@stevebot'),
                    `[#тест@stevebot](${LINK_PREFIX}wall-175914098?q=%23тест)`
                );
            });

            it('Проверка текста с обычными и навигационными #хештегоми', async () => {
                assert.deepStrictEqual(
                    await new Markdown(vk)
                        .fix('#Очень длинный текст #hashtag\n#hello #test@stevebot\nПродолжение #тест@apiclub'),
                    `[#Очень](${LINK_PREFIX}feed?section=search&q=%23Очень) длинный текст [#hashtag](${LINK_PREFIX}feed?section=search&q=%23hashtag)\n[#hello](${LINK_PREFIX}feed?section=search&q=%23hello) [#test@stevebot](${LINK_PREFIX}stevebot/test)\nПродолжение [#тест@apiclub](${LINK_PREFIX}wall-1?q=%23тест)`
                );
            });

            it('Проверка текста c Wiki-ссылками и #хештегами разного формата', async () => {
                assert.deepStrictEqual(
                    await new Markdown(vk)
                        .fix(`#hello #test@stevebot\n#тест@apiclub Очень длинный текст [club1|VK API]\n[${LINK_PREFIX}stevebot|Steve - Minecraft Бот] [id1|test]`),
                    `[#hello](${LINK_PREFIX}feed?section=search&q=%23hello) [#test@stevebot](${LINK_PREFIX}stevebot/test)\n[#тест@apiclub](${LINK_PREFIX}wall-1?q=%23тест) Очень длинный текст [VK API](${LINK_PREFIX}club1)\n[Steve - Minecraft Бот](${LINK_PREFIX}stevebot) [test](${LINK_PREFIX}id1)`
                );
            });
        }

        it('Проверка текста c wiki-ссылкой', async () => {
            assert.deepStrictEqual(
                await new Markdown(vk)
                    .fix('[id1|test]'),
                `[test](${LINK_PREFIX}id1)`
            );
        });
    });
});

if (process.env.TOKEN) {
    const { group_id } = cluster.vk;

    const storage = new Storage({
        vk,
        prefix: group_id
    });

    const sender = new Sender({
        ...cluster,
        storage,
        VK: vk,
        index: 1
    }, payload);

    describe('Sender', () => {
        describe('post();', () => {
            it('Проверка на отсутствие ошибок при отправке записи в Discord', async () => {
                storage.set(`${group_id}-last`, 0);
                storage.set(`${group_id}-published`, []);

                await sender.handle();
            });
        });

        describe('pushDate();', () => {
            it('Проверка на соответствие даты опубликованной записи', async () => {
                Storage.cache.clear();

                const [last, published] = await Promise.all([
                    storage.get(`${group_id}-last`, FieldType.NUMBER),
                    storage.get(`${group_id}-published`, FieldType.ARRAY_NUMBER)
                ]);

                assert.ok(
                    last === payload.date &&
                    published.includes(payload.date)
                );
            });
        });
    });
}
