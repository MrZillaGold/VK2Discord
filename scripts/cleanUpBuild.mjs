import { promises as fs } from "fs";

const OUT_DIR = "dist";

const RM_OPTIONS = {
    recursive: true,
    force: true
};

const dist = await fs.readdir("./build");

if (dist.includes("src")) {
    await fs.rename("./build/src", "./dist");
} else {
    await fs.rename("./build", "./dist");
}

await Promise.all([
    fs.rm(`./${OUT_DIR}/interfaces`, RM_OPTIONS),
    fs.unlink(`./${OUT_DIR}/interfaces.js`),
    fs.rm(`./build`, RM_OPTIONS)
]);
