import * as fs from "fs";
import { IAutoRoles, IBot, IConfiguration, ILastMessageID, IYoutube, IYoutubeStats } from "./interface/Configuration";

export default class Configuration
{
    name: string;
    file: Buffer;
    config: IConfiguration;
    bot: IBot;
    youtube: IYoutube;
    auto_roles: IAutoRoles;
    youtube_stats: IYoutubeStats;
    last_message_id: ILastMessageID;

    constructor()
    {
        // File name to look for
        this.name = "config.json";

        // Load configuration from file
        this.file = fs.readFileSync(this.name);
        this.config = JSON.parse(this.file.toString());

        // Assign configuration to each variable
        this.bot = this.config.bot;
        this.youtube = this.config.youtube;
        this.auto_roles = this.config.auto_roles;
        this.youtube_stats = this.config.youtube_stats;
        this.last_message_id = this.config.last_message_id;
    }

    async modify(type: keyof IConfiguration, property: string, newValue: string)
    {
        //Check if value exists in the current config
        if (!this.config.hasOwnProperty(type) && !this.config[ type ].hasOwnProperty(property))
        {
            throw console.error(`No property defined with the name "${ property }"`);
        }

        const newConfig = { ...this.config, [ type ]: { ...this.config[ type ], [ property ]: newValue } };
        fs.writeFileSync(this.name, JSON.stringify(newConfig, null, 4));

        this.reload();
    }

    reload()
    {
        // Load configuration from file
        this.file = fs.readFileSync(this.name);
        this.config = JSON.parse(this.file.toString());

        // Assign configuration to each variable
        this.bot = this.config.bot;
        this.youtube = this.config.youtube;
        this.auto_roles = this.config.auto_roles;
        this.youtube_stats = this.config.youtube_stats;
        this.last_message_id = this.config.last_message_id;
    }
}