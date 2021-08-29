import { Low, JSONFile } from 'lowdb';

export interface ICluster {
    id?: number;
    last?: number;
    published?: number[];
}

export type DBSchema = Record<string, ICluster>;

const adapter = new JSONFile<DBSchema>('./cache.json');

export const db = new Low(adapter);

await db.read();

db.data ||= {};

db.write();
