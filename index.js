const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();
const exp = "نحتاج مساعدتك في ترجمة بعض الجمل\nعلى سبيل المثال: \n العربية: اخرج من ذلك المكان \n تماشق: ازجر دغ أدج وديد";
const { TOKEN } = process.env;

console.log(TOKEN);
const bot = new TelegramBot(TOKEN, { polling: true });

bot.on("message", async(msg) => {

    console.table({ message: msg.text })
    const chatId = msg.chat.id;
    const userInput = msg.text;
    if (userInput != "/start") return;
    bot.sendMessage(chatId, "مرحبًا بكم, مشروعنا يتعلق بانشاء منصة ترجمة بين العربية ولغة تماشق!\n نحتاج مساعدتك في جمع بيانات لغة Tamasheq.\nهل أنت مهتم بالمساهمة في هذا المشروع؟", {
        "reply_markup": {
            "inline_keyboard": [
                [{
                    text: "نعم",
                    callback_data: "yes",
                }, {
                    text: "لا",
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
    const fromId = msg.from.id
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
        accept_handle(chatId, fromId);


    }

});

const yes_handle = async(chatId) => {
    bot.sendMessage(chatId, exp, {
        "reply_markup": {
            "inline_keyboard": [
                [{
                    text: "موافق",
                    callback_data: "accept",
                }, {
                    text: "إلغاء",
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
                    text: "موافق",
                    callback_data: "accept",
                }, {
                    text: "Cancel",
                    callback_data: "no",
                }]
            ]
        }
    });
}


const accept_handle = async(chatId, fromId) => {
    // read the file containing Arabic sentences
    await fs.readFile("arabic.txt", "utf8", async(err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        // split the sentences by newline
        var sentences = data.split("\n");

        // pick the first sentence
        const sentence = sentences[0];


        // remove the sentence from the arabic.txt file
        await sentences.shift();
        await fs.writeFile("arabic.txt", sentences.join("\n"), (err) => {
            if (err) console.error(err);
        });


        // send the sentence to the chat
        await bot.sendMessage(chatId, `ترجم الجملة التالية إلى تماشق:\n ${sentence}`);

        var repeat = false;
        // wait for the client's response
        const responseListener = async(msg) => {

            if (msg.chat.id === chatId /* && msg.from.id === fromId */ ) {
                // remove the event listener
                bot.removeListener("message", responseListener);

                // write the response in the tamasheq.txt file
                await fs.appendFile("tamasheq.txt", `${sentence}\t${msg.text}\t${msg.from.id}\n`, (err) => {
                    if (err) console.error(err);
                });
                await bot.sendMessage(chatId, "هل تود المتابعة؟", {
                    "reply_markup": {
                        "inline_keyboard": [
                            [{
                                text: "نعم",
                                callback_data: "accept",
                            }, {
                                text: "لا شكرا",
                                callback_data: "no",
                            }]
                        ]
                    }
                });
            } else {
                bot.removeListener("message", responseListener);

                bot.on("message", responseListener);
            }
            // return;
        };
        bot.on("message", responseListener);

    });
};