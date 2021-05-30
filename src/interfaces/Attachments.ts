import { AttachmentTypeString } from "vk-io";

type AttachmentTypeUnion = AttachmentTypeString | "textlive";

export type Attachment = {
    type: AttachmentTypeUnion;
} & {
    [key in AttachmentTypeUnion]: any;
};

export type AttachmentFields = string[];
export type ParsedAttachments = string[];

export type AttachmentFieldType = "post" | "repost";
