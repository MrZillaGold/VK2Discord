import { HexColorString, MessageEmbed } from 'discord.js';
import { IWallPostContextPayload } from 'vk-io';
import { GroupsGetByIdObjectLegacyResponse, UsersGetResponse } from 'vk-io/lib/api/schemas/responses';
import { GroupsGroupFull, WallWallpostFull } from 'vk-io/lib/api/schemas/objects';

import { Sender } from './sender.js';
import { Storage } from './storage.js';
import { VK, TokenType } from './vk.js';
import { AttachmentTypeUnion } from './attachments.js';

import { getById, getPostAuthor, getPostLink, getResourceId, IProfile } from '../utils/index.js';

export interface VKParams {
    token: string;
    group_id: string;
    keywords: string[];
    words_blacklist: string[];
    filter: boolean;
    donut: boolean;
    ads: boolean;
    longpoll?: boolean;
    interval: number;
}

export enum Exclude {
    TEXT = 'text',
    ATTACHMENTS = 'attachments',
    REPOST_TEXT = 'repost_text',
    REPOST_ATTACHMENTS = 'repost_attachments'
}

export interface DiscordParams {
    webhook_urls: string[];
    username: string;
    avatar_url: string;
    content: string;
    color: string | HexColorString;
    author: boolean;
    copyright: boolean;
    date: boolean;
    exclude_content: (AttachmentTypeUnion | Exclude)[];
}

export interface Cluster {
    vk: VKParams;
    discord: DiscordParams;

    VK: VK;
    storage: Storage;
    index: number;
}

// noinspection JSMethodCanBeStatic
export class Handler {

    readonly cluster: Pick<Cluster, 'vk' | 'discord' | 'index'>;

    protected VK: VK;
    readonly storage: Storage;

    constructor(cluster: Handler['cluster']) {
        this.cluster = cluster;

        const vk = new VK({
            token: cluster.vk.token,
            apiMode: 'parallel'
        });

        this.VK = vk;
        this.storage = new Storage({
            vk
        });
    }

    async init(): Promise<this> {
        const { api } = this.VK;

        const [users, groups] = await Promise.allSettled([
            api.users.get({}),
            api.groups.getById({})
        ])
            .then((results) => (
                results.map(({ status, ...rest }) => (
                    status === 'fulfilled' && 'value' in rest ?
                        rest.value
                        :
                        null
                )) as [UsersGetResponse | null, GroupsGetByIdObjectLegacyResponse | null]
            ));

        if (users?.length) {
            const [{ id }] = users;

            this.VK.setTokenType(TokenType.USER);
            this.storage.setPrefix(String(id));

            this.#startInterval();
        } else if (groups?.length) {
            const [{ id }] = groups;

            this.cluster.vk.longpoll = true;

            this.VK.setTokenType(TokenType.GROUP);
            this.storage.setPrefix(`-${id}`);

            this.#startPolling();
        } else {
            this.storage.setPrefix(this.cluster.vk.token);

            this.#startInterval();
        }

        return this;
    }

    #startInterval(): void {
        const { index, vk: { interval, group_id, filter }, discord: { author, copyright, date } } = this.cluster;

        console.log(`[VK2Discord] Кластер #${index} будет проверять новые записи с интервалом в ${interval} секунд.`);

        if (interval < 20) {
            console.warn('[!] Не рекомендуем ставить интервал получения постов меньше 20 секунд, во избежания лимитов ВКонтакте!');
        }

        setInterval(async () => {
            const id = await getResourceId(this.VK, group_id)
                .then((id) => {
                    if (!id) {
                        return console.error(`[!] ${group_id} не является ID-пользователя или группы ВКонтакте!`);
                    }

                    return id;
                });

            if (!id) {
                return;
            }

            this.VK.api.wall.get({
                owner_id: id,
                count: 2,
                extended: 1,
                filter: filter ? 'owner' : 'all',
                v: '5.131'
            })
                .then(async ({ groups, profiles, items }) => {
                    if (items.length) {
                        // Проверяем наличие закрепа, если он есть берем свежую запись
                        const payload = (
                            items.length === 2 && Number(items[0].date) < Number(items[1].date) ?
                                items[1]
                                :
                                items[0]
                        );

                        const sender = this.#createSender(payload);

                        const [embed] = sender.embeds;

                        if (date) {
                            embed.setTimestamp(payload.date! * 1_000);
                        }

                        if (author) {
                            const postAuthor = getPostAuthor(payload, profiles, groups);

                            this.#setAuthor(payload, embed, postAuthor);
                        }

                        if (copyright) {
                            await this.#setCopyright(payload, embed);
                        }

                        return sender.handle();
                    }

                    console.log(`[!] В кластере #${index} не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.`);
                })
                .catch((error) => {
                    console.error(`[!] Произошла ошибка при получении записей ВКонтакте в кластере #${index}:`);
                    console.error(error);
                });
        }, interval * 1000);
    }

    #startPolling(): void {
        const { index, discord: { author, copyright, date } } = this.cluster;

        this.VK.updates.on('wall_post_new', async (context) => {
            const payload = context['payload'];

            if (payload.post_type === 'post') {
                const sender = this.#createSender(payload);

                const [embed] = sender.embeds;

                if (date) {
                    embed.setTimestamp(payload.date as number * 1_000);
                }

                if (author) {
                    const postAuthor = await getById(this.VK.api, payload.from_id);

                    this.#setAuthor(payload, embed, postAuthor);
                }

                if (copyright) {
                    await this.#setCopyright(payload, embed);
                }

                return sender.handle();
            }
        });

        this.VK.updates.start()
            .then(() => console.log(`[VK2Discord] Кластер #${index} подключен к ВКонтакте с использованием LongPoll!`))
            .catch((error) => {
                console.error(`[!] Произошла ошибка при подключении к LongPoll ВКонтакте в кластере #${index}:`);
                console.error(error);
            });
    }

    #createSender(payload: Sender['payload']): Sender {
        const { cluster, VK, storage } = this;

        return new Sender({
            ...cluster,
            VK,
            storage
        }, payload as WallWallpostFull);
    }

    async #setCopyright({ copyright, signer_id }: WallWallpostFull | IWallPostContextPayload, embed: MessageEmbed): Promise<void> {
        if (signer_id) {
            const user = await getById(this.VK.api, signer_id);

            embed.setFooter({
                text: user?.name!,
                iconURL: user?.photo_50
            });
        }

        if (copyright) {
            const group = await getById(this.VK.api, copyright.id);

            embed.setFooter({
                text: `${embed.footer?.text ? `${embed.footer.text} • ` : ''}Источник: ${copyright.name}`,
                iconURL: embed.footer?.iconURL || group?.photo_50
            });
        }
    }

    #setAuthor(payload: WallWallpostFull | IWallPostContextPayload, embed: MessageEmbed, author?: IProfile | GroupsGroupFull | null): void {
        if (author) {
            const { name, photo_50 } = author;

            embed.setAuthor({
                name: name!,
                iconURL: photo_50,
                url: getPostLink(payload)
            });
        }
    }
}
