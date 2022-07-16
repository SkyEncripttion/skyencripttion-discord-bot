import { HexColorString } from "discord.js";

export interface IConfiguration {
    info: {
        name: string,
        serverId: string,
    },
    youtube: {
        id: string,
        logo: string,
    },
    autoRoles: {
        channelId: string,
        rolesId: string,
        message: IMessage
    },
    youtubeStats: {
        message: IMessage
    },
    lastMessageId: {
        autoRoles: string,
        youtubeStats: string,
    },
}

interface IMessage {
    channelId: string,
    color?: HexColorString,
    title?: string,
    description?: string,
}