import "dotenv/config";
import _, { rest } from "lodash";
import { config } from "./configuration";
import { Client, Client as ClientJS, CommandInteraction, GatewayIntentBits, Interaction, MessageEditOptions, REST, Routes, SlashCommandBuilder, TextChannel } from "discord.js";
import AutoRoles from "./routines/roles";
import YoutubeStats from "./routines/youtube";
import { Commands } from "./commands";

// Get environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;

const BotIntents = [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
];

const client = new ClientJS({ intents: [ BotIntents ] });

client.on("ready", async (client: Client) => await onStartup(client));
client.on("interactionCreate", async (interaction) => await onInteraction(interaction));

async function onStartup(client: Client)
{
    if (BOT_TOKEN == undefined) return;

    const rest =  new REST({ version: "10" }).setToken(
        BOT_TOKEN
    );

    console.log(`[Status] ${ config.info.name } BOT is now running`);

    // Handler
    // Auto roles
    AutoRoles(client);

    // Routines
    // YouTube subscriber counter
    YoutubeStats(client);
    setInterval(async () => YoutubeStats(client), 60000);

    // Register commands
    const commandData = Commands.map((command) => command.data.toJSON());

    await rest.put(
        Routes.applicationGuildCommands(
            client.user?.id || "missing id",
            config.info.serverId
        ),
        { body: commandData }
    )
}

async function onInteraction(interaction: Interaction)
{
    if (interaction.isCommand()) {
        for (const Command of Commands) {
        if (interaction.commandName === Command.data.name) {
            await Command.run(interaction);
            break;
        }
        }
    }
};

client.login(BOT_TOKEN)