import scriptPackage from "../package.json";

export const { LATEST_CONFIG_VERSION } = scriptPackage;
export const [NODE_MAJOR_VERSION] = Number(process.versions.node.split("."));
