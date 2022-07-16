import * as fs from "fs";
import { IConfiguration } from "./interface/configuration";

const CONFIG_NAME = "config.json";

export default class Configuration
{
    private config: IConfiguration;

    constructor()
    {
        try
        {
            const file = fs.readFileSync(CONFIG_NAME);
            this.config = JSON.parse(file.toString());
        }
        catch (err)
        {
            throw console.error(`Error whilst reading config file. ERROR: ${ err }`);
        }
    }

    get info() {
        return this.config.info;
    }

    get youtube() {
        return this.config.youtube;
    }

    get autoRoles() {
        return this.config.autoRoles;
    }

    get youtubeStats() {
        return this.config.youtubeStats;
    }

    get lastMessageId() {
        return this.config.lastMessageId;
    }

    async modify(type: keyof IConfiguration, property: string, newValue: string)
    {
        if (!this.config.hasOwnProperty(type) && !this.config[ type ].hasOwnProperty(property))
        {
            throw console.error(`No property defined with the name "${ property }"`);
        }

        this.config = { ...this.config, [ type ]: { ...this.config[ type ], [ property ]: newValue } };

        try
        {
            fs.writeFileSync(CONFIG_NAME, JSON.stringify(this.config, null, 4));
        }
        catch (err)
        {
            throw console.error(`Error whilst writing config file. ERROR: ${ err }`);
        }
    }
}