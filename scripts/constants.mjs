import path from "path";

import scriptPackage from "../package.json";

export const __dirname = path.resolve();
export const { LATEST_CONFIG_VERSION } = scriptPackage;
export const [NODE_MAJOR_VERSION] = process.versions.node.split(".");
