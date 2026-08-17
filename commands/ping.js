const {
    SlashCommandBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('MusicBot bağlantısını kontrol eder.'),

    async execute(interaction) {
        await interaction.reply('🎵 Pong! MusicBot çalışıyor.');
    }
};