import lowdb from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync.js";

import { IDBSchema } from "../interfaces";

const adapter = new FileAsync<IDBSchema>("./cache.json");

export const db = await lowdb(adapter);

db.defaults({ })
    .write();
