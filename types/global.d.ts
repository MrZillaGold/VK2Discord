import { ICluster } from '../src/modules';

declare module 'config.json' {
    const config: {
        clusters: Pick<ICluster, 'vk' | 'discord'>[];
        version_dont_modify_me: number;
    };
    export default config;
}
