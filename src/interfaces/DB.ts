interface Cluster {
    last: number;
    published: number[];
}

export type DBCluster = Cluster | null;

export interface DBSchema {
    [key: string]: Cluster;
}
