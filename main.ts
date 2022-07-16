import "dotenv/config";
import _ from "lodash";
import Configuration from "./configuration";
import { google, youtube_v3 } from "googleapis";
import { Client as ClientJS, Intents, Interaction, MessageActionRow, MessageButton, MessageEditOptions, MessageEmbed, MessageOptions, TextChannel } from "discord.js";

// Get environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Get configuration from file
const config = new Configuration();

const BotIntents = new Intents();
BotIntents.add(
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS
)

const Client = new ClientJS({ intents: [ BotIntents ] });

Client.on("ready", async () => await onStartup());
Client.on("interactionCreate", async (interaction) => await HandleMessageActions(interaction));

async function onStartup()
{
    console.log(`[Status] ${ config.info.name } BOT is now running`);

    // Check if auto roles message already sent
    if (!config.lastMessageId.autoRoles) {
        // Post Message
        await PostAutoRolesMessage();
    }
    else {
        // Cache the current posted message already
        const channel = Client.channels.cache.get(config.autoRoles.message.channelId) as TextChannel;

        // Fetch last message_id to cache
        channel.messages.fetch(config.lastMessageId.autoRoles);
    }

    // Check if youtube stats already sent
    if (!config.lastMessageId.youtubeStats) {
        // Post Message
        await PostYoutubeStats();
    }

    setInterval(async () => UpdateYoutubeStats(), 60000);
}

async function PostAutoRolesMessage()
{
    // Load channel id, server id from config
    const channel = Client.channels.cache.get(config.autoRoles.message.channelId) as TextChannel;
    const guild = Client.guilds.cache.get(config.info.serverId);

    if (!guild)
    {
        console.error(`[Error] ${ config.info.name } BOT is not in the server!`);
        return;
    }

    const { title, description, color } = config.autoRoles.message;

    if (_.isUndefined(title) || _.isUndefined(description) || _.isUndefined(color))
    {
        console.error("[Error] Invalid auto roles configuration!");
        return;
    }

    const embeds = new MessageEmbed()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);

    const subscribeAction = new MessageButton()
        .setCustomId("subscribe")
        .setLabel("Subscribe")
        .setStyle("SUCCESS");

    const unsubscribeAction = new MessageButton()
        .setCustomId("unsubscribe")
        .setLabel("Unsubscribe")
        .setStyle("DANGER");

    const messageActions = new MessageActionRow()
        .addComponents(subscribeAction, unsubscribeAction);

    const messageToSend: MessageOptions = {
        embeds: [ embeds ],
        components: [ messageActions ]
    }

    if (!channel)
    {
        console.log("[Error] Channel not found");
        return;
    }

    const message = await channel.send(messageToSend);

    // Modify message id in config
    config.modify("lastMessageId", "autoRoles", message.id.toString());
}

async function HandleMessageActions(interaction: Interaction)
{
    if (!interaction.isButton()) return;

    const serverId = config.info.serverId;
    const rolesId = config.autoRoles.rolesId;
    const guild = await Client.guilds.fetch(serverId);

    if (!guild)
    {
        console.log(`[Error] Guild with server id ${ serverId } not found!`);
        return;
    }

    const roles = await guild.roles.fetch(rolesId);

    if (!roles)
    {
        console.log(`[Error] Roles with id ${ rolesId } not found!`);
        return;
    }

    const user = await guild.members.fetch(interaction.user.id);

    switch (interaction.customId)
    {
        case "subscribe": 
            console.info(`[Info] User:${user.id} pressed subscribe button`);
            
            // Check if user already subscribed
            if (user.roles.cache.some(role => role.id === config.autoRoles.rolesId))
            {
                await interaction.reply({ content: "Kamu sudah berada di Notification Squad!", ephemeral: true });
                return;
            }

            // Add notification squad roles to user
            user.roles.add(roles);

            await interaction.reply({ content: "Selamat datang di Noficiation Squad!", ephemeral: true });
            break;

        case "unsubscribe":
            console.log(`[Info] User:${user.id} pressed unsubscribe button`);

            // Check if user already unsubscribed
            if (!user.roles.cache.some(role => role.id === rolesId))
            {
                await interaction.reply({ content: "Kamu sudah tidak berada di Notification Squad!", ephemeral: true });
                return;
            }

            // Add notification squad roles to user
            user.roles.remove(roles);

            await interaction.reply({ content: "Kamu sudah tidak berada di Notification Squad", ephemeral: true });
            break

        default:
            return;
    }
}

async function GetYoutubeChannelStatistics() {
    const youtube = google.youtube({
        version: 'v3',
        auth: GOOGLE_API_KEY
    });

    const SkyEncripttionChannel: youtube_v3.Params$Resource$Channels$List = {
        part: ["statistics"],
        id: [ config.youtube.id ]
    }

    const response = await youtube.channels.list(SkyEncripttionChannel);

    if (!response.data.items) return null;

    return {
        "subscriber_count": response.data.items[ 0 ].statistics?.subscriberCount,
        "view_count": response.data.items[ 0 ].statistics?.viewCount,
        "video_count": response.data.items[ 0 ].statistics?.videoCount
    };
}

async function PostYoutubeStats()
{
    // Load channel id, server id from config
    const channel = Client.channels.cache.get(config.youtubeStats.message.channelId) as TextChannel;

    if (!channel)
    {
        console.error("[Error] Channel not found");
        return;
    }
    
    const { color } = config.youtubeStats.message;

    if (_.isUndefined(color))
    {
        console.error("[Error] Invalid youtube stats configuration!");
        return;
    }

    const embeds = new MessageEmbed()
        .setTitle("Fetching info...")
        .setColor(color);

    const messageToSend: MessageOptions = {
        embeds: [ embeds ]
    }

    const message = await channel.send(messageToSend);

    await config.modify("lastMessageId", "youtubeStats", message.id.toString());
}

async function UpdateYoutubeStats() {
    const data = await GetYoutubeChannelStatistics();

    if (!data) {
        console.log("[Error] Could not fetch data");
        return;
    }

    const { subscriber_count, view_count, video_count } = data;

    // Load channel id, message id from config
    const channel = Client.channels.cache.get(config.youtubeStats.message.channelId) as TextChannel;

    if (!channel)
    {
        console.log("[Error] Channel not found");
        return;
    }

    const message = await channel.messages.fetch(config.lastMessageId.youtubeStats);

    const thumbnail = config.youtube.logo;

    const newChannelName = `${ subscriber_count }-subscriber`;

    const { title, color } = config.youtubeStats.message;

    if (_.isUndefined(title) || _.isUndefined(color))
    {
        console.error("[Error] Invalid youtube stats configuration!");
        return;
    }

    const embeds = new MessageEmbed()
        .setTitle(title)
        // WARNING: This description has invisible character in the start and end (Alt +0173)
        .setDescription("­­\n**" + subscriber_count + "** Subscriber\n" + "**" + view_count + "** Total Views\n" + "**" + video_count + "** Video Uploaded\n­­")
        .setColor(color)
        .setThumbnail(thumbnail)
        .setTimestamp(new Date().getTime())
        .setFooter({
            text: "Last updated"
        });

    const messageToSend: MessageEditOptions = {
        embeds: [ embeds ]
    }

    await message.edit(messageToSend);
    await channel.edit({ name: newChannelName });

    config.modify("lastMessageId", "youtubeStats", message.id.toString());
}

Client.login(BOT_TOKEN)