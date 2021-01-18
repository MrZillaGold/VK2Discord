import { promises as fs } from "fs";

import { __dirname } from "./constants.mjs";

const OUT_DIR = "dist";

const RM_OPTIONS = {
    recursive: true,
    force: true
};

await fs.rename(`${__dirname}/build/src`, `${__dirname}/dist`);

await Promise.all([
    fs.rm(`${__dirname}/${OUT_DIR}/interfaces`, RM_OPTIONS),
    fs.unlink(`${__dirname}/${OUT_DIR}/interfaces.js`),
    fs.rm(`${__dirname}/build`, RM_OPTIONS)
]);
