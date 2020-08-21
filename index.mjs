import { Handler } from "./modules/Handler";

import config from "./config";

const { clusters } = config;

clusters.forEach((cluster, index) =>
    new Handler({
        ...cluster,
        index: index + 1
    })
        .init()
);

console.log("[VK2Discord] Запущен.");
