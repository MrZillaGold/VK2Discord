import scriptPackage from "../package.json";

export const { LATEST_CONFIG_VERSION } = scriptPackage;
export const [NODE_MAJOR_VERSION] = process.versions.node.split(".");
