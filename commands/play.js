const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Müzik çalar.')
        .addStringOption(option =>
            option
                .setName('sarki')
                .setDescription('Şarkı adı veya YouTube linki')
                .setRequired(true)
        ),

    async execute(interaction, client) {

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Önce bir ses kanalına gir.',
                ephemeral: true
            });
        }

        const query = interaction.options.getString('sarki');

        await interaction.deferReply();

        try {

            console.log(`🔎 Aranıyor: ${query}`);

            const player = client.lavalink.createPlayer({
                guildId: interaction.guild.id,
                voiceChannelId: voiceChannel.id,
                textChannelId: interaction.channel.id,
                selfDeaf: true,
                selfMute: false
            });

            if (!player.connected) {
                await player.connect();
            }

            /*
             * YouTube URL ise direkt URL olarak gönderiyoruz.
             * Arama kelimesi ise ytsearch: kullanıyoruz.
             */
            let searchQuery = query;

            if (
                !query.startsWith('http://') &&
                !query.startsWith('https://')
            ) {
                searchQuery = `ytsearch:${query}`;
            }

            console.log(`🎵 Lavalink sorgusu: ${searchQuery}`);

            const result = await player.search(
                {
                    query: searchQuery
                },
                interaction.user
            );

            console.log('🎵 Lavalink sonucu:', result);

            if (!result) {
                return interaction.editReply(
                    '❌ Lavalink herhangi bir sonuç döndürmedi.'
                );
            }

            if (result.loadType === 'error') {

                console.error(
                    '❌ Lavalink arama hatası:',
                    result.exception
                );

                return interaction.editReply(
                    `❌ Şarkı aranırken Lavalink hata verdi.\n\`${result.exception?.message || 'Bilinmeyen hata'}\``
                );
            }

            if (
                !result.tracks ||
                result.tracks.length === 0
            ) {
                return interaction.editReply(
                    '❌ Şarkı bulunamadı.'
                );
            }

            const track = result.tracks[0];

            console.log(
                `✅ Şarkı bulundu: ${track.info.title}`
            );

            await player.playTrack({
                track
            });

            const embed = new EmbedBuilder()
                .setTitle('🎵 Şimdi Çalıyor')
                .setDescription(
                    `**${track.info.title}**`
                )
                .addFields(
                    {
                        name: '👤 Sanatçı',
                        value:
                            track.info.author ||
                            'Bilinmiyor',
                        inline: true
                    },
                    {
                        name: '🔊 Kanal',
                        value: voiceChannel.name,
                        inline: true
                    }
                )
                .setURL(
                    track.info.uri || null
                )
                .setColor(0x5865F2);

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                '🎵 PLAY HATASI:',
                error
            );

            if (
                interaction.deferred ||
                interaction.replied
            ) {
                await interaction.editReply(
                    '❌ Müzik başlatılırken hata oluştu. Konsolu kontrol et.'
                );
            }

        }
    }
};