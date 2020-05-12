import { Handler } from "./modules/handler";

import config from "./config";

const { clusters } = config;

console.log("[VK2DISCORD] Запущен.");

clusters.forEach((cluster, index) => {
    const handler = new Handler();

    handler.setCluster({
        ...cluster,
        index: index + 1
    });

    handler.init();
});
