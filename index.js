
const { Client, LocalAuth } = require('whatsapp-web.js');


const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "my-to-do-list"
    })
});
client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});


client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});



client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', async (message) => {
    const msgBody = message.body.trim();
    console.log(msgBody)

    if (msgBody.startsWith("/link")) {
        console.log("link");
        await message.reply('Link saved');
    }
    if (msgBody.startsWith("/savetonotion")) {
        const stn = msgBody.slice(14).trim();
        await message.reply(stn);
    }
    // Check if the message starts with "/thought"
    else if (msgBody.startsWith("/thought")) {
        console.log("thought");
        await message.reply('Thought saved');
    }
})

