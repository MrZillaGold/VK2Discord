import { AttachmentTypeString } from "vk-io";

type AttachmentType = AttachmentTypeString | "album";

export type Attachment = {
    type: AttachmentType;
} & {
    [key in AttachmentType]: any;
};

export interface PoppedPhotoAttachment {
    url: string
}

export type AttachmentFields = string[];
export type ParsedAttachments = string[];

export type AttachmentFieldsType = "post" | "repost";
