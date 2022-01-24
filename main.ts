import "dotenv/config";
import Configuration from "./configuration";
import { google, youtube_v3 } from "googleapis";
import { Client as ClientJS, Intents, Interaction, MessageActionRow, MessageButton, MessageEmbed, MessageOptions, TextChannel } from "discord.js";

// Get current configuration
const Config = new Configuration();

// Get environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const BotIntents = new Intents();
BotIntents.add(
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS
)

const Client = new ClientJS({ intents: [ BotIntents ] });

let taskUpdateYoutubeStats = false;

Client.on("ready", async () => await onStartup());
Client.on("interactionCreate", async (interaction) => await HandleMessageActions(interaction));

async function onStartup()
{
    
    console.log(`[Status] ${ Config.bot.name } BOT is now running`);

    // Check if auto roles message already sent
    if (!Config.last_message_id.auto_roles) {
        // Post Message
        await PostAutoRolesMessage();
    }
    else {
        // Cache the current posted message already
        const channel = Client.channels.cache.get(Config.auto_roles.channel_id) as TextChannel;

        // Fetch last message_id to cache
        channel.messages.fetch(Config.last_message_id.auto_roles);
    }

    // Check if youtube stats already sent
    if (!Config.last_message_id.youtube_stats) {
        // Post Message
        await PostYoutubeStats();
    }

    taskUpdateYoutubeStats = true;
    UpdateYoutubeStats();
}

async function PostAutoRolesMessage()
{
    // Load channel id, server id from config
    const channel = Client.channels.cache.get(Config.auto_roles.channel_id) as TextChannel;
    const guild = Client.guilds.cache.get(Config.bot.server_id);

    if (!guild)
    {
        console.log(`[Error] ${ Config.bot.name } BOT is not in the server`);
        return;
    }

    const embeds = new MessageEmbed()
        .setTitle(Config.auto_roles.title)
        .setDescription(Config.auto_roles.description)
        .setColor(Config.auto_roles.color);

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
    Config.modify("last_message_id", "auto_roles", message.id.toString());
}

async function HandleMessageActions(interaction: Interaction)
{
    if (!interaction.isButton()) return;

    const guild = await Client.guilds.fetch(Config.bot.server_id);

    if (!guild)
    {
        console.log("[Error] Guild not found");
        return;
    }

    const roles = await guild.roles.fetch(Config.auto_roles.roles_id);

    if (!roles)
    {
        console.log("[Error] Roles not found");
        return;
    }

    const user = await guild.members.fetch(interaction.user.id);

    switch (interaction.customId)
    {
        case "subscribe": 
            console.log(`[Info] User:${user.id} pressed subscribe button`);
            
            // Check if user already subscribed
            if (user.roles.cache.some(role => role.id === Config.auto_roles.roles_id))
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
            if (!user.roles.cache.some(role => role.id === Config.auto_roles.roles_id))
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
        id: [ Config.youtube.channel_id ]
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
    const channel = Client.channels.cache.get(Config.youtube_stats.channel_id) as TextChannel;

    if (!channel)
    {
        console.log("[Error] Channel not found");
        return;
    }

    const embeds = new MessageEmbed()
        .setTitle("Fetching info...")
        .setColor(Config.youtube_stats.color);

    const messageToSend: MessageOptions = {
        embeds: [ embeds ]
    }

    const message = await channel.send(messageToSend);

    await Config.modify("last_message_id", "youtube_stats", message.id.toString());
}

async function UpdateYoutubeStats() {
    while (taskUpdateYoutubeStats) {

        const data = await GetYoutubeChannelStatistics();

        if (!data) {
            console.log("[Error] Could not fetch data");
            return;
        }

        const { subscriber_count, view_count, video_count } = data;

        // Load channel id, message id from config
        const channel = Client.channels.cache.get(Config.youtube_stats.channel_id) as TextChannel;

        if (!channel)
        {
            console.log("[Error] Channel not found");
            return;
        }

        const message = await channel.messages.fetch(Config.last_message_id.youtube_stats);

        const thumbnail = Config.youtube.logo_url;

        const newChannelName = `${ subscriber_count }-subscriber`;

        const embeds = new MessageEmbed()
            .setTitle(Config.youtube_stats.title)
            // WARNING: This description has invisible character in the start and end (Alt +0173)
            .setDescription("­­\n**" + subscriber_count + "** Subscriber\n" + "**" + view_count + "** Total Views\n" + "**" + video_count + "** Video Uploaded\n­­")
            .setColor(Config.youtube_stats.color)
            .setThumbnail(thumbnail)
            .setTimestamp(new Date().getTime())
            .setFooter({
                text: "Last updated"
            });

        const messageToSend: MessageOptions = {
            embeds: [ embeds ]
        }

        await message.edit(messageToSend);
        await channel.edit({ name: newChannelName });

        Config.modify("last_message_id", "youtube_stats", message.id.toString());

        await new Promise(thisFunction => setTimeout(thisFunction, 60000))
    }
}

Client.login(BOT_TOKEN)