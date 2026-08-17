```js
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    Client,
    Collection,
    GatewayIntentBits
} = require('discord.js');

const {
    LavalinkManager
} = require('lavalink-client');

// =========================
// DISCORD CLIENT
// =========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// =========================
// KOMUTLARI YÜKLE
// =========================

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    console.error('❌ commands klasörü bulunamadı!');
    process.exit(1);
}

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {

    try {

        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (
            command.data &&
            command.execute
        ) {

            client.commands.set(
                command.data.name,
                command
            );

            console.log(
                `✅ Komut yüklendi: ${command.data.name}`
            );

        } else {

            console.log(
                `⚠️ ${file} geçerli bir komut değil.`
            );

        }

    } catch (error) {

        console.error(
            `❌ ${file} yüklenirken hata oluştu:`,
            error
        );

    }
}

console.log(
    `📦 Toplam komut: ${client.commands.size}`
);

// =========================
// LAVALINK AYAR KONTROLÜ
// =========================

console.log('🔧 Lavalink ayarları kontrol ediliyor...');

console.log(
    'Host:',
    process.env.LAVALINK_HOST || 'YOK'
);

console.log(
    'Port:',
    process.env.LAVALINK_PORT || 'YOK'
);

console.log(
    'Secure:',
    process.env.LAVALINK_SECURE || 'false'
);

if (!process.env.LAVALINK_HOST) {
    console.error('❌ LAVALINK_HOST Railway Variables içinde yok!');
}

if (!process.env.LAVALINK_PORT) {
    console.error('❌ LAVALINK_PORT Railway Variables içinde yok!');
}

if (!process.env.LAVALINK_PASSWORD) {
    console.error('❌ LAVALINK_PASSWORD Railway Variables içinde yok!');
}

// =========================
// LAVALINK
// =========================

client.lavalink = new LavalinkManager({

    nodes: [
        {
            id: 'CashMusic-Lavalink',

            host: process.env.LAVALINK_HOST,

            port: Number(
                process.env.LAVALINK_PORT || 2333
            ),

            authorization:
                process.env.LAVALINK_PASSWORD,

            secure:
                process.env.LAVALINK_SECURE === 'true',

            retryAmount: 10,

            retryDelay: 5000
        }
    ],

    sendToShard: (guildId, payload) => {

        const guild =
            client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(
                `⚠️ Guild bulunamadı: ${guildId}`
            );
            return;
        }

        guild.shard.send(payload);
    },

    autoSkip: true,

    client: {

        id: process.env.CLIENT_ID,

        username: 'CashMusic'

    }

});

// =========================
// DISCORD RAW EVENT
// =========================

client.on('raw', data => {

    try {

        client.lavalink.sendRawData(data);

    } catch (error) {

        console.error(
            '❌ Lavalink raw event hatası:',
            error
        );

    }

});

// =========================
// LAVALINK CONNECT
// =========================

client.lavalink.nodeManager.on(
    'connect',
    node => {

        console.log(
            `🎧 Lavalink bağlandı: ${node.id}`
        );

    }
);

// =========================
// LAVALINK DISCONNECT
// =========================

client.lavalink.nodeManager.on(
    'disconnect',
    (node, reason) => {

        console.log(
            `❌ Lavalink bağlantısı kesildi: ${node.id}`
        );

        console.log(
            'Sebep:',
            reason
        );

    }
);

// =========================
// LAVALINK ERROR
// =========================

client.lavalink.nodeManager.on(
    'error',
    (node, error) => {

        console.error(
            `❌ Lavalink hatası (${node.id}):`
        );

        console.error(error);

    }
);

// =========================
// BOT READY
// =========================

client.once('ready', async () => {

    console.log('');
    console.log('================================');
    console.log(`🎵 ${client.user.tag} AKTİF!`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🏠 Sunucu sayısı: ${client.guilds.cache.size}`);
    console.log(`📦 Komut sayısı: ${client.commands.size}`);
    console.log('================================');
    console.log('');

    try {

        client.lavalink.init({

            id: client.user.id,

            username: client.user.username

        });

        console.log(
            '🎧 Lavalink başlatıldı.'
        );

    } catch (error) {

        console.error(
            '❌ Lavalink init hatası:',
            error
        );

    }

});

// =========================
// SLASH COMMAND
// =========================

client.on(
    'interactionCreate',
    async interaction => {

        console.log(
            `📥 Interaction geldi: ${interaction.type} ${interaction.commandName || ''}`
        );

        if (!interaction.isChatInputCommand()) {
            return;
        }

        console.log(
            `⚡ Komut çalışıyor: /${interaction.commandName}`
        );

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) {

            console.error(
                `❌ Komut bulunamadı: ${interaction.commandName}`
            );

            if (!interaction.replied && !interaction.deferred) {

                await interaction.reply({
                    content: '❌ Bu komut CashMusic tarafından bulunamadı.',
                    ephemeral: true
                });

            }

            return;
        }

        try {

            await command.execute(
                interaction,
                client
            );

            console.log(
                `✅ Komut tamamlandı: /${interaction.commandName}`
            );

        } catch (error) {

            console.error(
                `❌ /${interaction.commandName} komut hatası:`,
                error
            );

            try {

                if (
                    interaction.replied ||
                    interaction.deferred
                ) {

                    await interaction.editReply({
                        content:
                            '❌ Komut çalıştırılırken hata oluştu.'
                    });

                } else {

                    await interaction.reply({

                        content:
                            '❌ Komut çalıştırılırken hata oluştu.',

                        ephemeral: true

                    });

                }

            } catch (replyError) {

                console.error(
                    '❌ Discord cevap gönderme hatası:',
                    replyError
                );

            }

        }

    }
);

// =========================
// DISCORD LOGIN
// =========================

console.log('🔐 Discord giriş yapılıyor...');

if (!process.env.TOKEN) {

    console.error(
        '❌ TOKEN Railway Variables içinde bulunamadı!'
    );

    process.exit(1);

}

client.login(
    process.env.TOKEN
)
.then(() => {

    console.log(
        '✅ Discord login başarılı.'
    );

})
.catch(error => {

    console.error(
        '❌ Discord login başarısız:',
        error
    );

    process.exit(1);

});
```
