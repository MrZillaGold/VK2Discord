import lowdb from "lowdb";
import FileAsync from "lowdb/adapters/FileAsync.js";

import { DBSchema } from "../interfaces/DB";

const adapter = new FileAsync<DBSchema>("./news.json");

export const db = await lowdb(adapter);
