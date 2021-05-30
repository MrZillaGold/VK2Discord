import { IWallPostContextPayload } from "vk-io";
import { MessageEmbed } from "discord.js";

import { VK } from "./VK.js";
import { Sender } from "./Sender.js";

import { getById, getPostAuthor, getPostLink, getResourceId } from "./functions.js";

import { ICluster, IGetPostLinkOptions } from "../interfaces";

export class Handler {

    protected cluster: Pick<ICluster, "vk" | "discord" | "index">;

    protected VK: VK;

    constructor(cluster: Pick<ICluster, "vk" | "discord" | "index">) {
        this.cluster = cluster;

        this.VK = new VK({
            token: cluster.vk.token,
            apiMode: "parallel"
        });
    }

    init(): void {
        if (!this.cluster.vk.longpoll) {
            this.startInterval();
        } else {
            this.startPolling();
        }
    }

    private startInterval(): void {
        const { index, vk: { interval, group_id, filter }, discord: { author, copyright } } = this.cluster;

        console.log(`[VK2Discord] Кластер #${index} будет проверять новые записи с интервалом в ${interval} секунд.`);

        if (interval < 30) {
            console.warn("[!] Не рекомендуем ставить интервал получения постов меньше 30 секунд, во избежания лимитов ВКонтакте!");
        }

        setInterval(async () => {
            const sender = this.createSender();
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

            const [builder] = sender.builders;

            this.VK.api.wall.get({
                owner_id: id,
                count: 2,
                extended: 1,
                filter: filter ? "owner" : "all",
                v: "5.131"
            })
                .then(async ({ groups, profiles, items }) => {
                    if (items.length) {
                        // @ts-ignore
                        const post = items.length === 2 && items[0].date < items[1].date ? items[1] : items[0]; // Проверяем наличие закрепа, если он есть берем свежую запись

                        builder.setTimestamp(post.date as number * 1000);

                        if (author) {
                            const postAuthor = getPostAuthor(post as IWallPostContextPayload, profiles, groups);

                            if (postAuthor) {
                                const { name, photo_50 } = postAuthor;

                                builder.setAuthor(name, photo_50, getPostLink(post as IGetPostLinkOptions));
                            }
                        }

                        if (copyright) {
                            await this.setCopyright(post as IWallPostContextPayload, builder);
                        }

                        return sender.handle(post as IWallPostContextPayload);
                    } else {
                        console.log(`[!] В кластере #${index} не получено ни одной записи. Проверьте наличие записей в группе или измените значение фильтра в конфигурации.`);
                    }
                })
                .catch((error) => {
                    console.error(`[!] Произошла ошибка при получении записей ВКонтакте в кластере #${index}:`);
                    console.error(error);
                });
        }, interval * 1000);
    }

    private startPolling(): void {
        const { index, discord: { author, copyright } } = this.cluster;

        this.VK.updates.on("wall_post_new", async (context) => {
            const payload = context["payload"];

            if (payload.post_type === "post") {
                const sender = this.createSender();

                const [builder] = sender.builders;

                builder.setTimestamp(payload.date as number * 1000);

                if (author) {
                    const postAuthor = await getById(this.VK.api, payload.from_id as number);

                    if (postAuthor) {
                        const { photo_50, name } = postAuthor;

                        builder.setAuthor(name, photo_50, getPostLink(payload));
                    }
                }

                if (copyright) {
                    await this.setCopyright(payload, builder);
                }

                return sender.handle(payload);
            }
        });

        this.VK.updates.start()
            .then(() => console.log(`[VK2Discord] Кластер #${index} подключен к ВКонтакте с использованием LongPoll!`))
            .catch((error) => {
                console.error(`[!] Произошла ошибка при подключении к LongPoll ВКонтакте в кластере #${index}:`);
                console.error(error);
            });
    }

    private createSender(): Sender {
        const cluster = this.cluster;
        const VK = this.VK;

        return new Sender({
            ...cluster,
            VK
        });
    }

    private async setCopyright({ copyright, signer_id }: IWallPostContextPayload, builder: MessageEmbed): Promise<void> {
        if (signer_id) {
            const user = await getById(this.VK.api, signer_id);

            builder.setFooter(user?.name, user?.photo_50);
        }

        if (copyright) {
            const group = await getById(this.VK.api, copyright.id);

            builder.setFooter(`${builder.footer?.text ? `${builder.footer.text} • ` : ""}Источник: ${copyright.name}`, builder.footer?.iconURL || group?.photo_50);
        }
    }
}
