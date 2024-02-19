
const { Client, LocalAuth } = require('whatsapp-web.js');

const { Client: NotionClient } = require('@notionhq/client');
const notion = new NotionClient({ auth: "secret_QUV1ux9p59RFOI3MO7jDPF2Wh8EE3DlmjB9t3D2p936" });


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
    const msgBody = message.body.trim().toLowerCase();
    const tagRegex = /#\w+/g;
    const tags = msgBody.match(tagRegex) || [];

    if (msgBody.startsWith("/savetonotion")) {
        let messageWithoutCommandAndTags = msgBody.slice(14).trim();

        tags.forEach(tag => {
            messageWithoutCommandAndTags = messageWithoutCommandAndTags.replace(tag, '').trim(); // Remove each tag
        });
        const formattedTags = tags.map(tag => ({ name: tag.replace('#', '') }));
        console.log("Tags:", tags);
        console.log("Message:", messageWithoutCommandAndTags);

        const title = messageWithoutCommandAndTags;
        const description = ""

        // sending notion request   
        const response = await notion.pages.create({

            "icon": {
                "type": "emoji",
                "emoji": "📖"
            },
            "parent": {
                "type": "database_id",
                "database_id": "63536f729a554d1d85bae187a414a138"
            },
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                },
                "Description": {
                    "rich_text": [
                        {
                            "text": {
                                "content": description
                            }
                        }
                    ]
                },
                "Tags": {
                    "multi_select": formattedTags
                }
            },


        });

        await message.reply(`✅ Your message is now on Notion! Check it out here: ${response.url}`);
        console.log(response)
    }
    if (msgBody.startsWith("/link")) {
        let messageWithoutCommandAndTags = msgBody.slice(5).trim(); // Adjusted slice index for "/link"
        // Assuming URLs are at the end or by regex extraction
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = messageWithoutCommandAndTags.match(urlRegex) || [];
        const firstUrl = urls.length > 0 ? urls[0] : "";

        if (firstUrl) {
            messageWithoutCommandAndTags = messageWithoutCommandAndTags.replace(firstUrl, '').trim();
        }

        tags.forEach(tag => {
            messageWithoutCommandAndTags = messageWithoutCommandAndTags.replace(tag, '').trim(); // Remove each tag
        });

        const formattedTags = tags.map(tag => ({ name: tag.replace('#', '') }));
        const title = messageWithoutCommandAndTags;
        const description = firstUrl;

        const response = await notion.pages.create({
            "icon": {
                "type": "emoji",
                "emoji": "📖"
            },
            "parent": {
                "type": "database_id",
                "database_id": "63536f729a554d1d85bae187a414a138"
            },
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                },

                "URL": {
                    "rich_text": [
                        {
                            "text": {
                                "content": description,
                                "link": {
                                    "url": firstUrl
                                }
                            }
                        }
                    ]
                },
                "Tags": {
                    "multi_select": formattedTags
                }
            },
            "children": [

                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {
                                    "content": "Click here for more information.",
                                    "link": {
                                        "url": firstUrl
                                    }
                                }
                            }
                        ],
                        "color": "default"
                    }
                }
            ]
        });

        console.log(response);
        // Assuming `message.reply` is how you send a reply, make sure this method exists in your context
        await message.reply(`✅ Your message is now on Notion! Check it out here: ${response.url}`);

    }


})



