import config from "../config";
import VKIO from "vk-io";

const { VK } = VKIO;
const vk = new VK();

const token = config.vk.token;
const groupId = config.vk.group_id;
const longpoll = config.vk.longpoll;

const interval = config.interval * 1000;

const filter = config.vk.filter;
const keywords = config.vk.keywords;

vk.setOptions({
    token,
    apiMode: "parallel" // Необходимо исользовать LongPoll версии 5.103
});

const { updates, api, snippets } = vk;

export {
    updates,
    api,
    snippets,

    longpoll,
    groupId,

    interval,

    filter,
    keywords
};