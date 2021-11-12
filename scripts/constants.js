import scriptPackage from '../package.json' assert { type: 'json' };

const { LATEST_CONFIG_VERSION, engines: { node } } = scriptPackage;

export const NODE_MAJOR_VERSION = getMajorVersion(process.versions.node);
export const ENGINE_SUPPORT_VERSION = getMajorVersion(node);

export {
    LATEST_CONFIG_VERSION
};

function getMajorVersion(version) {
    return Number(version.split('.')[0]);
}
