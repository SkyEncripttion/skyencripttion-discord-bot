import { Client, Interaction, MessageActionRow, MessageButton, MessageEmbed, MessageOptions, TextChannel } from "discord.js";
import { config } from "../configuration";
import _ from "lodash";

export default async function AutoRoles(client: Client)
{
    client.on("interactionCreate", async (interaction) => await HandleMessageActions(client, interaction));

    // Load channel id, server id from config
    const channel = client.channels.cache.get(config.autoRoles.message.channelId) as TextChannel;

    if (_.isUndefined(channel))
    {
        console.error("[Error] Invalid auto roles configuration!");
        return;
    }

    // Check if last message id in config
    const lastMessageId = config.lastMessageId.autoRoles;

    // No youtube stats posted
    if (_.isUndefined(lastMessageId) || lastMessageId === "")
    {
        await Post(channel);
    }
    else
    {
        // Fetch message to cache
        channel.messages.fetch(config.lastMessageId.autoRoles);
    }
}

async function Post(channel: TextChannel)
{
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

    const message = await channel.send(messageToSend);

    // Modify message id in config
    config.modify("lastMessageId", "autoRoles", message.id.toString());
}

async function HandleMessageActions(client: Client, interaction: Interaction)
{
    if (!interaction.isButton()) return;

    const serverId = config.info.serverId;
    const rolesId = config.autoRoles.rolesId;
    const guild = await client.guilds.fetch(serverId);

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