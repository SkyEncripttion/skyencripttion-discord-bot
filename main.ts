import "dotenv/config";
import _ from "lodash";
import { config } from "./configuration";
import { Client as ClientJS, Intents, Interaction, MessageActionRow, MessageButton, MessageEditOptions, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import AutoRoles from "./routines/roles";
import YoutubeStats from "./routines/youtube";

// Get environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;

const BotIntents = new Intents();
BotIntents.add(
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS
);

const client = new ClientJS({ intents: [ BotIntents ] });

client.on("ready", async () => await onStartup());

async function onStartup()
{
    console.log(`[Status] ${ config.info.name } BOT is now running`);

    // Handler
    // Auto roles
    AutoRoles(client);

    // Routines
    // YouTube subscriber counter
    YoutubeStats(client);
    setInterval(async () => YoutubeStats(client), 60000);
}

client.login(BOT_TOKEN)