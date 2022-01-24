"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const configuration_1 = __importDefault(require("./configuration"));
const googleapis_1 = require("googleapis");
const discord_js_1 = require("discord.js");
// Get current configuration
const Config = new configuration_1.default();
// Get environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BotIntents = new discord_js_1.Intents();
BotIntents.add(discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.GUILD_MEMBERS);
const Client = new discord_js_1.Client({ intents: [BotIntents] });
let taskUpdateYoutubeStats = false;
Client.on("ready", () => __awaiter(void 0, void 0, void 0, function* () { return yield onStartup(); }));
Client.on("interactionCreate", (interaction) => __awaiter(void 0, void 0, void 0, function* () { return yield HandleMessageActions(interaction); }));
function onStartup() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Status] ${Config.bot.name} BOT is now running`);
        // Check if auto roles message already sent
        if (!Config.last_message_id.auto_roles) {
            // Post Message
            yield PostAutoRolesMessage();
        }
        else {
            // Cache the current posted message already
            const channel = Client.channels.cache.get(Config.auto_roles.channel_id);
            // Fetch last message_id to cache
            channel.messages.fetch(Config.last_message_id.auto_roles);
        }
        // Check if youtube stats already sent
        if (!Config.last_message_id.youtube_stats) {
            // Post Message
            yield PostYoutubeStats();
        }
        taskUpdateYoutubeStats = true;
        UpdateYoutubeStats();
    });
}
function PostAutoRolesMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        // Load channel id, server id from config
        const channel = Client.channels.cache.get(Config.auto_roles.channel_id);
        const guild = Client.guilds.cache.get(Config.bot.server_id);
        if (!guild) {
            console.log(`[Error] ${Config.bot.name} BOT is not in the server`);
            return;
        }
        const embeds = new discord_js_1.MessageEmbed()
            .setTitle(Config.auto_roles.title)
            .setDescription(Config.auto_roles.description)
            .setColor(Config.auto_roles.color);
        const subscribeAction = new discord_js_1.MessageButton()
            .setCustomId("subscribe")
            .setLabel("Subscribe")
            .setStyle("SUCCESS");
        const unsubscribeAction = new discord_js_1.MessageButton()
            .setCustomId("unsubscribe")
            .setLabel("Unsubscribe")
            .setStyle("DANGER");
        const messageActions = new discord_js_1.MessageActionRow()
            .addComponents(subscribeAction, unsubscribeAction);
        const messageToSend = {
            embeds: [embeds],
            components: [messageActions]
        };
        if (!channel) {
            console.log("[Error] Channel not found");
            return;
        }
        const message = yield channel.send(messageToSend);
        // Modify message id in config
        Config.modify("last_message_id", "auto_roles", message.id.toString());
    });
}
function HandleMessageActions(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!interaction.isButton())
            return;
        const guild = yield Client.guilds.fetch(Config.bot.server_id);
        if (!guild) {
            console.log("[Error] Guild not found");
            return;
        }
        const roles = yield guild.roles.fetch(Config.auto_roles.roles_id);
        if (!roles) {
            console.log("[Error] Roles not found");
            return;
        }
        const user = yield guild.members.fetch(interaction.user.id);
        switch (interaction.customId) {
            case "subscribe":
                console.log(`[Info] User:${user.id} pressed subscribe button`);
                // Check if user already subscribed
                if (user.roles.cache.some(role => role.id === Config.auto_roles.roles_id)) {
                    yield interaction.reply({ content: "Kamu sudah berada di Notification Squad!", ephemeral: true });
                    return;
                }
                // Add notification squad roles to user
                user.roles.add(roles);
                yield interaction.reply({ content: "Selamat datang di Noficiation Squad!", ephemeral: true });
                break;
            case "unsubscribe":
                console.log(`[Info] User:${user.id} pressed unsubscribe button`);
                // Check if user already unsubscribed
                if (!user.roles.cache.some(role => role.id === Config.auto_roles.roles_id)) {
                    yield interaction.reply({ content: "Kamu sudah tidak berada di Notification Squad!", ephemeral: true });
                    return;
                }
                // Add notification squad roles to user
                user.roles.remove(roles);
                yield interaction.reply({ content: "Kamu sudah tidak berada di Notification Squad", ephemeral: true });
                break;
            default:
                return;
        }
    });
}
function GetYoutubeChannelStatistics() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const youtube = googleapis_1.google.youtube({
            version: 'v3',
            auth: GOOGLE_API_KEY
        });
        const SkyEncripttionChannel = {
            part: ["statistics"],
            id: [Config.youtube.channel_id]
        };
        const response = yield youtube.channels.list(SkyEncripttionChannel);
        if (!response.data.items)
            return null;
        return {
            "subscriber_count": (_a = response.data.items[0].statistics) === null || _a === void 0 ? void 0 : _a.subscriberCount,
            "view_count": (_b = response.data.items[0].statistics) === null || _b === void 0 ? void 0 : _b.viewCount,
            "video_count": (_c = response.data.items[0].statistics) === null || _c === void 0 ? void 0 : _c.videoCount
        };
    });
}
function PostYoutubeStats() {
    return __awaiter(this, void 0, void 0, function* () {
        // Load channel id, server id from config
        const channel = Client.channels.cache.get(Config.youtube_stats.channel_id);
        if (!channel) {
            console.log("[Error] Channel not found");
            return;
        }
        const embeds = new discord_js_1.MessageEmbed()
            .setTitle("Fetching info...")
            .setColor(Config.youtube_stats.color);
        const messageToSend = {
            embeds: [embeds]
        };
        const message = yield channel.send(messageToSend);
        yield Config.modify("last_message_id", "youtube_stats", message.id.toString());
    });
}
function UpdateYoutubeStats() {
    return __awaiter(this, void 0, void 0, function* () {
        while (taskUpdateYoutubeStats) {
            const data = yield GetYoutubeChannelStatistics();
            if (!data) {
                console.log("[Error] Could not fetch data");
                return;
            }
            const { subscriber_count, view_count, video_count } = data;
            // Load channel id, message id from config
            const channel = Client.channels.cache.get(Config.youtube_stats.channel_id);
            if (!channel) {
                console.log("[Error] Channel not found");
                return;
            }
            const message = yield channel.messages.fetch(Config.last_message_id.youtube_stats);
            const thumbnail = Config.youtube.logo_url;
            const newChannelName = `${subscriber_count}-subscriber`;
            const embeds = new discord_js_1.MessageEmbed()
                .setTitle(Config.youtube_stats.title)
                // WARNING: This description has invisible character in the start and end (Alt +0173)
                .setDescription("­­\n**" + subscriber_count + "** Subscriber\n" + "**" + view_count + "** Total Views\n" + "**" + video_count + "** Video Uploaded\n­­")
                .setColor(Config.youtube_stats.color)
                .setThumbnail(thumbnail)
                .setTimestamp(new Date().getTime())
                .setFooter({
                text: "Last updated"
            });
            const messageToSend = {
                embeds: [embeds]
            };
            yield message.edit(messageToSend);
            yield channel.edit({ name: newChannelName });
            Config.modify("last_message_id", "youtube_stats", message.id.toString());
            yield new Promise(thisFunction => setTimeout(thisFunction, 60000));
        }
    });
}
Client.login(BOT_TOKEN);
