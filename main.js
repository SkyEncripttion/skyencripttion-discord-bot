"use strict";

const Discord = require("discord.js");
const Configuration = require("./configuration.js");
const { google } = require("googleapis");

// Get current config
const config = new Configuration();

const client = new Discord.Client();

let taskUpdateYoutubeStats = false;

const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

client.on("ready", async () => await onStartup());
client.on("message", (message) => onMessage(message));
client.on("messageReactionAdd", (reaction, user) => onReactionAdd(reaction, user));

async function onStartup()
{
    console.log(`${ config.bot.name } BOT is now running`);

    // Check if auto roles message already sent
    if (!config.last_message_id.auto_roles)
    {
        // Post Message
        await PostAutoRolesMessage();
    }
    else
    {
        // Cache the current posted message already
        client.channels.cache.get(config.auto_roles.channel_id).messages.fetch(config.last_message_id.auto_roles);
    }

    // Check if youtube stats already sent
    if (!config.last_message_id.youtube_stats)
    {
        // Post Message
        await PostYoutubeStats();
    }

    taskUpdateYoutubeStats = true;
    UpdateYoutubeStats();
}

async function GetYoutubeChannelStatistics()
{
    const youtube = google.youtube({
        version: 'v3',
        auth: GOOGLE_API_KEY
    });

    const response = await youtube.channels.list({
        part: 'statistics',
        id: config.youtube.channel_id
    })

    return {
        "subscriber_count": response.data.items[ 0 ].statistics.subscriberCount,
        "view_count": response.data.items[ 0 ].statistics.viewCount,
        "video_count": response.data.items[ 0 ].statistics.videoCount
    };
}

async function PostYoutubeStats()
{
    // Load channel id, server id from config
    const channel = client.channels.cache.get(config.youtube_stats.channel_id);

    const messageToSend = new Discord.MessageEmbed()
        .setTitle("Fetching info...")
        .setColor(config.youtube_stats.color);

    const message = await channel.send(messageToSend);

    await config.modify("last_message_id", "youtube_stats", message.id.toString());
    console.log("PostYoutubeStats DONE!");
}

async function UpdateYoutubeStats()
{
    while (taskUpdateYoutubeStats)
    {
        const { subscriber_count, view_count, video_count } = await GetYoutubeChannelStatistics();

        // Load channel id, message id from config
        const channel = client.channels.cache.get(config.youtube_stats.channel_id);
        const message = await channel.messages.fetch(config.last_message_id.youtube_stats);

        const thumbnail = config.youtube.logo_url;

        const newChannelName = `${ subscriber_count }-subscriber`;

        const messageToSend = new Discord.MessageEmbed()
            .setTitle(config.youtube_stats.title)
            // WARNING: This description has invisible character in the start and end (Alt +0173)
            .setDescription("­­\n**" + subscriber_count + "** Subscriber\n" + "**" + view_count + "** Total Views\n" + "**" + video_count + "** Video Uploaded\n­­")
            .setColor(config.youtube_stats.color)
            .setThumbnail(thumbnail)
            .setTimestamp(new Date().getTime())
            .setFooter("Last updated");

        await message.edit(messageToSend);
        await channel.edit({ name: newChannelName });

        config.modify("last_message_id", "youtube_stats", message.id.toString());

        await new Promise(thisFunction => setTimeout(thisFunction, 60000))
    }
}

async function PostAutoRolesMessage()
{
    // Load channel id, server id from config
    const channel = client.channels.cache.get(config.auto_roles.channel_id);
    const guild = client.guilds.cache.get(config.bot.server_id);

    const subscribe_emoji = guild.emojis.cache.get(config.auto_roles.subscribe_emoji[ 1 ]);
    const unsubscribe_emoji = guild.emojis.cache.get(config.auto_roles.unsubscribe_emoji[ 1 ]);

    const messageToSend = new Discord.MessageEmbed()
        .setTitle(config.auto_roles.title)
        .setDescription(config.auto_roles.description)
        .setColor(config.auto_roles.color);

    const message = await channel.send(messageToSend);

    message.react(subscribe_emoji);
    message.react(unsubscribe_emoji);

    // Modify message id in config
    config.modify("last_message_id", "auto_roles", message.id.toString());
}

async function onMessage(message)
{
    const args = message.content.split(/ +/);

    if (!message.mentions.has(client.user.id) || message.author.bot)
    {
        return;
    }
}

async function onReactionAdd(reaction, user)
{
    // If bot who add reaction
    if (user.bot)
    {
        return;
    }

    // If Reaction on AutoRoles channel
    if (reaction.message.id == config.last_message_id.auto_roles)
    {
        const guild = await client.guilds.fetch(config.bot.server_id);
        const roles = await guild.roles.fetch(config.auto_roles.roles_id);

        const subscribe_emoji = guild.emojis.cache.get(config.auto_roles.subscribe_emoji[ 1 ]);
        const unsubscribe_emoji = guild.emojis.cache.get(config.auto_roles.unsubscribe_emoji[ 1 ]);

        if (reaction.emoji === subscribe_emoji)
        {
            (await guild.members.fetch(user.id)).roles.add(roles);
            reaction.users.remove(user);
        }

        if (reaction.emoji === unsubscribe_emoji)
        {
            (await guild.members.fetch(user.id)).roles.remove(roles);
            reaction.users.remove(user);
        }
    }
}

client.login(BOT_TOKEN)