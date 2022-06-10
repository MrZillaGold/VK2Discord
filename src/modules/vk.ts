import { VK as _VK, resolveResource, IResolvedTargetResource, IResolvedOwnerResource } from 'vk-io';

export enum TokenType {
    USER = 'user',
    GROUP = 'group',
    SERVICE = 'service'
}

export class VK extends _VK {

    tokenType = TokenType.SERVICE;

    resolveResource(resource: string): Promise<IResolvedTargetResource | IResolvedOwnerResource> {
        return resolveResource({
            resource,
            api: this.api
        });
    }

    setTokenType(type: TokenType): void {
        this.tokenType = type;
    }

}
