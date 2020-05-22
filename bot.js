const { Telegraf } = require('telegraf')
const fs = require('fs');
const TOKEN = '1281981211:AAF1aGYUggPy3OKWBqfd4FcBo_jxhNmw3Ek';
const CHANNEL_ID = '-1001220573893';
const bot = new Telegraf(TOKEN);
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const FormData = require('form-data');


bot.start((ctx) => ctx.reply('Welcome'));
telegram.sendMessage(CHANNEL_ID, 'privet pidor');
const fileName = './testv.mp4';

const video = fs.readFileSync(fileName)
const image = fs.readFileSync('./testp.jpg');

// const F = {
//     headers: { 'Content-Type': 'multipart/form-data'},
//     formData: {
//         "video": fs.readFileSync(fileName)
//     }
// }


telegram.sendVideo(CHANNEL_ID, {source: video}).catch(err => console.log(err));
// telegram.sendPhoto(CHANNEL_ID, image).catch(err => console.log(err));


// bot.start((ctx) => ctx.reply('Welcome'))
// bot.help((ctx) => ctx.reply('Send me a sticker'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))
// bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()


// https://dev.to/django_stars/how-to-create-and-deploy-a-telegram-bot-37lj