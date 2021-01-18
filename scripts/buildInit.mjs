import { promises as fs } from "fs";

import { __dirname } from "./constants.mjs";

await fs.rm(`${__dirname}/dist`, {
    recursive: true, force: true
});
