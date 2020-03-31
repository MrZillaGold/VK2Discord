import webhook from "webhook-discord";

import config from "../config";

const name = config.discord.bot_name.slice(0, 32);
const color = config.discord.color.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/m) ? config.discord.color : "#aabbcc";
const urls = config.discord.webhook_urls;
/*const sendAll = config.discord.send_all;*/

export {
    webhook,
    name,
    color,
    urls,
    /*sendAll*/
};