import { Handler, Cluster, Storage } from './modules';

// @ts-ignore
import config from '../config.json' assert { type: 'json' };

const { clusters } = config;

console.log('[VK2Discord] Запущен.');

const handlers = await Promise.all(
    clusters.map((cluster, index) => (
        new Handler({
            ...cluster,
            index: index + 1
        })
            .init()
    ))
);

const uniqueHandlers = handlers.reduce<[Storage, Cluster['vk']['group_id'][]][]>((handlers, handler) => {
    const instanceIndex = handlers.findIndex(([{ prefix }]) => (
        prefix === handler.storage.prefix
    ));
    const hasInstance = instanceIndex !== -1;

    const handlerGroupId = handler.cluster.vk.group_id;

    if (!hasInstance) {
        handlers.push([handler.storage, [handlerGroupId]]);
    } else {
        handlers[instanceIndex][1].push(handlerGroupId);
    }

    return handlers;
}, []);

uniqueHandlers.forEach(async ([storage, groupIds]) => {
    const keys = await storage.getKeys();

    const outdatedKeys = keys.reduce<string[]>((keys, key) => {
        if (
            key.startsWith(Storage.PREFIX) &&
            groupIds.findIndex((id) => key.includes(`-${id}-`)) === -1
        ) {
            keys.push(key);
        }

        return keys;
    }, []);

    await Promise.all(
        outdatedKeys.map((key) => (
            storage.set(key)
        ))
    );
});
