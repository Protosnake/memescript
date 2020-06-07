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
const request = require('request-promise');
const HTMLParser = require('node-html-parser');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = require('csv-write-stream')

const BASE_URL = "https://2ch.hk";
const linkSelector = 'figcaption a.desktop';


// bot.start((ctx) => ctx.reply('Welcome'));
// telegram.sendMessage(CHANNEL_ID, 'privet pidor');
// const fileName = './video.mp4';
// const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';

// const video = fs.readFileSync(fileName)
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

// telegram.sendMessage(CHANNEL_ID, "kek");

function getLinks(threadIds) {
    const mediaLinks = {};
    return new Promise((resolve, reject) => {
        return Promise.all(threadIds.map((threadId) => {
            mediaLinks[threadId] = [];
            return request(`${BASE_URL}${threadId}`).then((res) => {
                var root = HTMLParser.parse(res);
                var links = root.querySelectorAll(linkSelector);
                links.forEach(link => {
                    // mediaLinks.push(link.getAttribute('href'));
                    mediaLinks[threadId].push(`${BASE_URL}${link.getAttribute('href')}`);
                });
            },
            err => console.log(`Could find media files in ${threadId} thred due to ${err.statusCode} error code`));
        })).then(() => {
            console.log(`Found ${mediaLinks.length} media files`);
            resolve(mediaLinks);
        }, error => reject(error));
    })
}

getLinks(["/b/arch/2020-06-03/res/221770287.html", "/b/arch/2020-06-03/res/221762523.html"])
    .then(res => {
        for(const property in res) {
            console.log(`${property} property`)
            res[property].forEach(link => console.log(`${link}`))
        }
    })