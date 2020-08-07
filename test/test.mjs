import assert from "assert";
import VKIO from "vk-io";

import { Keywords } from "../modules/Keywords.mjs"
import { Markdown } from "../modules/Markdown.mjs";
import { Sender } from "../modules/Sender.mjs";

import payload from "./payload.json";

const { VK } = VKIO;

const cluster = {
    vk: {
        keywords: [],
        filter: false,
        group_id: "Test",
        longpoll: false
    },
    discord: {
        webhook_urls: [
            process.env.WEBHOOK
        ],
        bot_name: "Travis",
        color: "#ffbbff"
    }
}

const vk = new VK()
    .setOptions({
        token: process.env.TOKEN
    })

describe("Keywords", function() {
    describe("check();", function() {

        const keyword = ["вконтакте"];
        const keywords = ["VK2disCOrd", "скРИпт"];
        const [text1, text2] = [
            "VK2Discord - скрипт для отправки постов из ВКонтакте в Discord с использованием WebHooks.",
            "Пройдите мимо нас и простите нам наше счастье."
        ];

        it("Проверка текста на соответствие ключевым словам", function() {
            assert.ok(
                new Keywords(keyword)
                    .check(text1)
            );

            assert.ok(
                new Keywords(keywords)
                    .check(text1)
            );
        });

        it("Проверка текста на несоответствие ключевым словам", function() {
            assert.deepStrictEqual(
                new Keywords(keyword)
                    .check(text2),
                false
            );

            assert.deepStrictEqual(
                new Keywords(keywords)
                    .check(text2),
                false
            );
        });

        it("Проверка функции на ошибки при отсутствии текста", function() {
            assert.doesNotThrow(() => {
                new Keywords(keywords)
                    .check("")

                new Keywords(keywords)
                    .check(null)
            });
        });
    });
});

describe("Markdown", function() {
    describe("fix();", function() {
        it("Проверка текста лишь с одним #хештегом", async function() {
            assert.deepStrictEqual(
                await new Markdown("#hashtag", vk)
                    .fix(),
                "[#hashtag](https://vk.com/feed?section=search&q=%23hashtag)"
            );
        });

        it("Проверка текста с одним #хештегом", async function() {
            assert.deepStrictEqual(
                await new Markdown("Очень длинный текст #hashtag", vk)
                    .fix(),
                "Очень длинный текст [#hashtag](https://vk.com/feed?section=search&q=%23hashtag)"
            );
        });

        it("Проверка текста с одним #хештегом и его переносом", async function() {
            assert.deepStrictEqual(
                await new Markdown(`
                Очень длинный текст
                
                #hashtag
                `, vk)
                    .fix(),
                `
                Очень длинный текст
                
                [#hashtag](https://vk.com/feed?section=search&q=%23hashtag)
                `
            );
        });

        it("Проверка текста лишь с одним навигационным #хештегом", async function() {
            assert.deepStrictEqual(
                await new Markdown("#test@stevebot", vk)
                    .fix(),
                "[#test@stevebot](https://vk.com/stevebot/test)"
            );
        });

        it("Проверка текста лишь с одним навигационным #хештегом содержащим кириллицу", async function() {
            assert.deepStrictEqual(
                await new Markdown("#тест@stevebot", vk)
                    .fix(),
                "[#тест@stevebot](https://vk.com/wall-175914098?q=%23тест)"
            );
        });

        it("Проверка текста с обычными и навигационными #хештегоми", async function() {
            assert.deepStrictEqual(
                await new Markdown(`
                #Очень длинный текст #hashtag
                #hello #test@stevebot
                
                Продолжение #тест@apiclub
                `, vk)
                    .fix(),
                `
                [#Очень](https://vk.com/feed?section=search&q=%23Очень) длинный текст [#hashtag](https://vk.com/feed?section=search&q=%23hashtag)
                [#hello](https://vk.com/feed?section=search&q=%23hello) [#test@stevebot](https://vk.com/stevebot/test)
                
                Продолжение [#тест@apiclub](https://vk.com/wall-1?q=%23тест)
                `
            );
        });

        it("Проверка текста c wiki-ссылкой", async function() {
            assert.deepStrictEqual(
                await new Markdown("[id1|test]", vk)
                    .fix(),
                "[test](https://vk.com/id1)"
            );
        });

        it("Проверка текста c Wiki-ссылками и #хештегами разного формата", async function() {
            assert.deepStrictEqual(
                await new Markdown(`
                #hello #test@stevebot
                #тест@apiclub Очень длинный текст [club1|VK API]
                
                [https://vk.com/stevebot|Steve - Minecraft Бот] [id1|test]
                `, vk)
                    .fix(),
                `
                [#hello](https://vk.com/feed?section=search&q=%23hello) [#test@stevebot](https://vk.com/stevebot/test)
                [#тест@apiclub](https://vk.com/wall-1?q=%23тест) Очень длинный текст [VK API](https://vk.com/club1)
                
                [Steve - Minecraft Бот](https://vk.com/stevebot) [test](https://vk.com/id1)
                `
            );
        });
    });
});

describe("Sender", function() {
    describe("post();", function() {
        it("Проверка на отсутствие ошибок при отправке записи в Discord", async function() {
            this.timeout(30000);

            await new Sender({
                ...cluster,
                index: 1,
                VK: vk
            })
                .post(payload);
        });
    });
});
