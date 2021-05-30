interface ICluster {
    id?: number;
    last?: number;
    published?: number[];
}

export type DBSchema = Record<string, ICluster>;
