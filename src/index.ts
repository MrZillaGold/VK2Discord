import { Handler } from "./modules/Handler.js";

// @ts-ignore
import config from "../config.json";

import { ICluster } from "./interfaces";

const { clusters } = config;

console.log("[VK2Discord] Запущен.");

clusters.forEach((cluster: Pick<ICluster, "vk" | "discord">, index: number): void => new Handler({
    ...cluster,
    index: index + 1
})
    .init());
