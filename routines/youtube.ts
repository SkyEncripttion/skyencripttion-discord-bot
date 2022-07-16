import { Client, MessageEditOptions, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import { google, youtube_v3 } from "googleapis";
import { config } from "../configuration";
import _ from "lodash";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export default async function YoutubeStats(client: Client) {
    const data = await GetYoutubeChannelStatistics();

    if (!data) {
        console.log("[Error] Could not fetch data");
        return;
    }

    const { subscriber_count, view_count, video_count } = data;

    // Load channel id, message id from config
    const channel = client.channels.cache.get(config.youtubeStats.message.channelId) as TextChannel;

    if (_.isUndefined(channel))
    {
        console.error("[Error] Invalid youtube stats configuration!");
        return;
    }

    const lastMessageId = config.lastMessageId.youtubeStats;

    // No youtube stats posted
    if (_.isUndefined(lastMessageId) || lastMessageId === "")
    {
        await Post(channel);
    }
    else
    {
        // Fetch message to cache
        channel.messages.fetch(config.lastMessageId.youtubeStats);
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

async function Post(channel: TextChannel)
{    
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