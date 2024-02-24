
const { Client, LocalAuth, MessageMedia, Poll, List, Buttons } = require('whatsapp-web.js');
const express = require("express")
require('dotenv').config()
const axios = require('axios');
const { Client: NotionClient } = require('@notionhq/client');
const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });
const app = express()
const qrcode = require('qrcode-terminal');


app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Save-to-notion running" })
})

app.listen(3000, () => {
    console.log("listening to port 3000")
})


const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "my-to-do-list"
    }),
    puppeteer: {
        headless: true
    }
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    console.log("QR Generated", qr)
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


    if (msgBody.startsWith("/help")) {
        const reply = "🤖 *WhatsApp Bot Help Guide* 🤖\nWelcome to the WhatsApp Bot! Below is a list of commands you can use:\n*POST Commands*: 📝\n1. */help* - Displays this help guide.\n2. */link* - Saves a link with an optional tag for easy retrieval. 🌐\n3. */thought* - Records a personal thought along with optional tags. 💭\n4. */remind* - Sets a reminder with a note. ⏰\n5. */save* - Saves a snippet of text with optional tags for later reference. 📌\n*GET Commands*: 🔍\n1. */documents* - Retrieves saved documents or links based on tags. 📂\n2. */toparticles* - Gets the top articles saved in the system. 📰\n\nTo use a command, simply type it followed by any necessary information. For example, *\"/remind 20:00 Take out the trash\"*.\nFeel free to reach out for more detailed instructions or if you encounter any issues. \nHappy chatting! 🚀\n\nFollow me on Twitter: (https://twitter.com/sidtalesara)";
        console.log(message);
        await message.reply(reply);
    }

    else if (message.body === '!reaction') {
        message.react('✅');
    }

    if (msgBody.startsWith("/save")) {
        let contentToSave = "";
        const formattedTags = tags.map(tag => ({ name: tag.replace('#', '') }));

        // Check if there's a quoted message and use its body
        if (message.hasQuotedMsg) {
            const quotedMsg = await message.getQuotedMessage(); // Make sure you await getting the quoted message
            contentToSave = quotedMsg.body.trim(); // Use the quoted message's text as content to save
        }

        // If no quoted message, use the current message, excluding command and tags
        if (contentToSave === "") {
            contentToSave = msgBody.slice(5).trim(); // Adjust this slice index based on your command length
            tags.forEach(tag => {
                contentToSave = contentToSave.replace(tag, '').trim(); // Remove each tag
            });
        }

        console.log("Tags:", formattedTags);
        console.log("Content to Save:", contentToSave);

        // Prepare for creating a new page in Notion
        const response = await notion.pages.create({
            "icon": {
                "type": "emoji",
                "emoji": "📖"
            },
            "parent": {
                "type": "database_id",
                "database_id": "63536f729a554d1d85bae187a414a138" // Make sure to use your actual database ID
            },
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": contentToSave // Use the content to save as the title or part of it
                            }
                        }
                    ]
                },
                "Tags": {
                    "multi_select": formattedTags
                }
            }
        });

        const data = {
            url: response.url,

        };


        const shortUrl = await axios.post('https://spoo.me/', data, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
        })
        await message.react('✅');
        await message.reply(`✅ Your message is now on Notion! Check it out here: ${shortUrl.data.short_url}`);

    }




    if (msgBody.startsWith("/link")) {
        let messageWithoutCommandAndTags = msgBody.slice(5).trim(); // Adjusted slice index for "/link"
        // Assuming URLs are at the end or by regex extraction
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = messageWithoutCommandAndTags.match(urlRegex) || [];
        const firstUrl = urls.length > 0 ? urls[0] : "";

        if (!firstUrl) {
            // If firstUrl is empty, reply with an error message or log it
            console.error("URL is required but not provided.");
            await message.reply("❌ Error: A URL is required but was not provided.");
            return; // Exit the function to prevent further execution
        }
        messageWithoutCommandAndTags = messageWithoutCommandAndTags.replace(firstUrl, '').trim();
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


        const shortUrl = await axios.post('https://spoo.me/', data, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
        })

        await message.react('✅');
        await message.reply(`✅ Your message is now on Notion! Check it out here: ${shortUrl.data.short_url}`);
        // Assuming `message.reply` is how you send a reply, make sure this method exists in your context
        // await message.reply(`✅ Your message is now on Notion! Check it out here: ${response.url}`);

    }


})

