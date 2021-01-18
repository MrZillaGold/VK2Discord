import { Handler } from "./modules/Handler";

// @ts-ignore
import config from "../config.json";

import { Cluster } from "./interfaces";

const { clusters } = config;

console.log("[VK2Discord] Запущен.");

clusters.forEach((cluster: Pick<Cluster, "vk" | "discord">, index: number): void =>
    new Handler({
        ...cluster,
        index: index + 1
    })
        .init()
);
