const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Replace with your own Telegram bot token
const token = '6176983296:AAE0sDksMlZgKXQXcZ5lcJi_8D3Uo4rVDlo';


// Create a new Telegram bot object
const bot = new TelegramBot(token, { polling: true });

// Read the lines from a text file and store them in an array
const lines = fs.readFileSync('tam.txt', 'utf-8').split('\n').filter(line => line.trim() !== '');

// Create a state object to keep track of the current line and recorded voice message
const state = {
    currentLine: 0,
    recordedVoice: null,
};

// Send the next line to the user
function sendNextLine(chatId) {
    const message = `Please read the following line:\n\n${lines[state.currentLine]}`;
    bot.sendMessage(chatId, message);
}

// Handle text messages from the user
bot.on('message', async(msg) => {
    const chatId = msg.chat.id;

    // If the user sends the start command, send the first line
    if (msg.text === '/start') {
        state.currentLine = 0;
        state.recordedVoice = null;
        sendNextLine(chatId);
        return;
    }

    // If the user sends a voice message, save it and prompt them to confirm or undo
    if (msg.voice) {
        state.recordedVoice = msg.voice;
        bot.sendMessage(chatId, 'Voice message recorded. Do you want to confirm or undo?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Confirm', callback_data: 'confirm' }, { text: 'Undo', callback_data: 'undo' }],
                ],
            },
        });
        return;
    }
});

// Handle callback queries from inline keyboards
bot.on('callback_query', async(query) => {
    const chatId = query.message.chat.id;

    // If the user confirms the recording, move to the next line and save the voice message to a file
    if (query.data === 'confirm') {
        // Create a directory to save the voice messages for this chat if it doesn't already exist
        const directory = path.join(__dirname, 'voices', /* String(chatId) */ lines[state.currentLine]);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        // Generate a file name for the voice message based on the current sentence
        const fileName = lines[state.currentLine] + String(chatId) + '.oga';

        // Save the voice message to a file
        try {
            const filePath = path.join(directory, fileName);
            const fileStream = bot.getFileStream(state.recordedVoice.file_id);
            const writeStream = fs.createWriteStream(filePath);
            fileStream.pipe(writeStream);
        } catch (err) { console.log("jri") }

        // Move to the next line and clear the recorded voice
        state.currentLine++;
        state.recordedVoice = null;

        // If there are no more lines, send a final message
        if (state.currentLine === lines.length) {
            bot.sendMessage(chatId, 'Thank you for participating!');
            return;
        }

        // Otherwise, send the next line
        sendNextLine(chatId);
        bot.answerCallbackQuery(query.id);
        return;
    }
    // If the user wants to redo the recording, prompt them to record again
    if (query.data === 'undo') {
        state.recordedVoice = null;
        sendNextLine(chatId);
        bot.answerCallbackQuery(query.id);
        return;
    }
});

// Listen for voice messages
bot.on('voice', async(msg) => {
    const chatId = msg.chat.id;

    // If we're waiting for the user to record a voice message, save it and display the confirm/undo buttons
    if (state.recordedVoice === null) {
        state.recordedVoice = msg.voice;
        bot.sendMessage(chatId, 'Voice message recorded. Do you want to confirm or undo?', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Confirm', callback_data: 'confirm' }, { text: 'Undo', callback_data: 'undo' }],
                ],
            },
        });
    }
});