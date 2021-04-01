interface ICluster {
    id?: number;
    last?: number;
    published?: number[];
}

export interface IDBSchema {
    [key: string]: ICluster;
}
