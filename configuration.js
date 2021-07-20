const fs = require("fs");

class Configuration
{
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

    async modify(type, property, newValue)
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

module.exports = Configuration;