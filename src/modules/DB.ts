import { Low, JSONFile } from "lowdb";

import { DBSchema } from "../interfaces";

const adapter = new JSONFile<DBSchema>("./cache.json");

export const db = new Low(adapter);

await db.read();

db.data ||= {};

db.write();
