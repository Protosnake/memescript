const { Telegraf } = require('telegraf')
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const TOKEN = '1281981211:AAF1aGYUggPy3OKWBqfd4FcBo_jxhNmw3Ek';
const CHANNEL_ID = '-1001220573893';
const bot = new Telegraf(TOKEN);
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const sleep = require('sleep-promise');
const moment = require('moment');



// bot.start((ctx) => ctx.reply('Welcome'));
// telegram.sendMessage(CHANNEL_ID, 'privet pidor');
const fileName = './video.mp4';
const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';

const video = fs.readFileSync(fileName)
// telegram.sendVideo(CHANNEL_ID, {source: video}).catch(err => console.log(err));
// // bot.launch()

// const dir = `${__dirname}/2020-05-22/`
// fs.readdirAsync(dir).then(files => {
//     return Promise.map(files, file => {
//         return new Promise((resolve, reject) => telegram.sendVideo(CHANNEL_ID, {source: `${dir}${file}`}, {supports_streaming: true}).then(() => resolve(), err => reject(err))).delay(2000).then(() => console.log(moment().format('hh:mm:ss')));
//     }, {concurrency: 1})
// })


// function sendFailed() {
//     const file = `${__dirname}/failed.txt`
//     fs.readFileSync(file).toString().split('\n').forEach(async (line) => { 
//         if (file.includes('https')) {
//             await telegram.sendVideo(CHANNEL_ID, line, {supports_streaming: true, caption}).catch(err => console.log(err))
//         }
//     }); 
// }

telegram.sendMessage(CHANNEL_ID, "kek");

