import { HexColorString } from "discord.js";

export interface IConfiguration {
    bot: IBot,
    youtube: IYoutube,
    auto_roles: IAutoRoles,
    youtube_stats: IYoutubeStats,
    last_message_id: ILastMessageID
}

export interface IBot {
    name: string,
    token: string,
    server_id: string
}

export interface IYoutube {
    api_key: string,
    channel_id: string,
    logo_url: string
}

export interface IAutoRoles {
    channel_id: string,
    roles_id: string,
    color: HexColorString,
    title: string,
    description: string
}

export interface IYoutubeStats {
    channel_id: string,
    color: HexColorString,
    title: string
}

export interface ILastMessageID {
    auto_roles: string,
    youtube_stats: string
}