interface ICluster {
    last: number;
    published: number[];
}

export interface IDBSchema {
    [key: string]: ICluster;
}
