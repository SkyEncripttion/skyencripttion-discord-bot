import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

export const ping: Command = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Ping the bot"),
    run: async (interaction) => {
        await interaction.reply("Pong!");
    },
};