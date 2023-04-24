const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const exp = "Here's an example \n arabic: اخرج من ذلك المكان \n tamasheq: ازجر دغ أدج وديد";
const { TOKEN } = process.env;

console.log(TOKEN);
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async(msg) => {

    console.log(msg);
    console.table({ message: msg.text })
    const chatId = msg.chat.id;
    const userInput = msg.text;
    if (userInput != "/start") return;
    bot.sendMessage(chatId, "Would you like to help us collecting Tamasheq data?", {
        "reply_markup": {
            "inline_keyboard": [
                [{
                    text: "Yes",
                    callback_data: "yes",
                }, {
                    text: "No",
                    callback_data: "no",
                }]
            ]
        }
    });
});




// Handle callback queries 
bot.on('callback_query', async function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const opts = {
        chat_id: msg.chat.id,
        // message_id: msg.message_id,
    };

    if (action === 'yes') {
        // text = 'jri';
        bot.deleteMessage(chatId, msg.message_id);
        yes_handle(chatId)
    } else if (action === 'no') {
        // text = 'ma tjrich';
        bot.deleteMessage(chatId, msg.message_id)
    } else if (action === 'accept') {
        // text = 'acceptinsd';
        bot.deleteMessage(chatId, msg.message_id)
        accept_handle(chatId);


    }

});

const yes_handle = async(chatId) => {
    bot.sendMessage(chatId, exp, {
        "reply_markup": {
            "inline_keyboard": [
                [{
                    text: "accept",
                    callback_data: "accept",
                }, {
                    text: "Cancel",
                    callback_data: "no",
                }]
            ]
        }
    });
}

const no_handle = async(chatId) => {
    bot.sendMessage(chatId, "Thank you for your help.\nIf you would like to start again, type /start", {
        "reply_markup": {
            "inline_keyboard": [
                [{
                    text: "accept",
                    callback_data: "accept",
                }, {
                    text: "Cancel",
                    callback_data: "no",
                }]
            ]
        }
    });
}


const accept_handle = async(chatId) => {
    // read the file containing Arabic sentences
    await fs.readFile("arabic.txt", "utf8", async(err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        // split the sentences by newline
        const sentences = data.split("\n");

        // pick the first sentence
        const sentence = sentences[0];

        // send the sentence to the chat
        await bot.sendMessage(chatId, `Translate to Tamasheq:\n ${sentence}`);

        // wait for the client's response
        await bot.once("message", async(msg) => {
            // write the response in the tamasheq.txt file
            await fs.appendFile("tamasheq.txt", `${sentence}\t${msg.text}\t${msg.from.id}\n`, (err) => {
                if (err) console.error(err);
            });

            // remove the sentence from the arabic.txt file
            await sentences.shift();
            await fs.writeFile("arabic.txt", sentences.join("\n"), (err) => {
                if (err) console.error(err);
            });
            await bot.sendMessage(chatId, "Would you like to continue?", {
                "reply_markup": {
                    "inline_keyboard": [
                        [{
                            text: "Yes",
                            callback_data: "accept",
                        }, {
                            text: "No",
                            callback_data: "no",
                        }]
                    ]
                }
            });
            return;
        });
    });



};