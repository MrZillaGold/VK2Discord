import { VK as _VK, resolveResource, IResolvedTargetResource, IResolvedOwnerResource } from "vk-io";

export class VK extends _VK {

    resolveResource(resource: string): Promise<IResolvedTargetResource | IResolvedOwnerResource> {
        return resolveResource({
            resource,
            api: this.api
        });
    }

}
