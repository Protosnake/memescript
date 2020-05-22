const {getThreadIds, getMediaLinks, filterLinks, downloadMemes} = require('./2chClient.js');
const {convert} = require('./convert.js')
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const { Telegraf } = require('telegraf')
const TOKEN = '1281981211:AAF1aGYUggPy3OKWBqfd4FcBo_jxhNmw3Ek';
const CHANNEL_ID = '-1001220573893';
const bot = new Telegraf(TOKEN);
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const moment = require('moment');
const sleep = require('sleep-promise');


const hrstart = process.hrtime();

// video can be link or a buffer
async function sendVideo(video, time = 0) {
    if (time > 0) {
        console.log(`Waiting ${time/1000}s`)
    }
    return Promise.delay(time).then(() => telegram.sendVideo(CHANNEL_ID, video, {supports_streaming: true})
        .catch(async error => {
            if (error.response.error_code === 400) {
                const failedVideo = video;
                if(typeof video === 'object') {
                    failedVideo = video.source;
                }
                fs.appendFileSync('./failed.txt', failedVideo + '\n');
                console.log(`Failed to upload ${error.on.payload.video}. Logged to failed.txt`);
            } else if (error.response.error_code === 429) {
                console.log(error.response.description);
            } else {
                console.log(error);
            }
            if (error.response.error_code === 429) {
                await sendVideo(video, error.response.parameters.retry_after * 1000);
            }
        }));
}

async function sendPhoto(link, time = 0) {
    return Promise.delay(time).then(() => telegram.sendPhoto(CHANNEL_ID, link, {supports_streaming: true})
        .catch(async error => {
            console.log(error.response.description);
            if (error.response.error_code === 429) {
                await sendVideo(link, error.response.parameters.retry_after * 1000);
            }
        }));
}


function run() {
    const date = moment().format('YYYY-MM-DD');
    const dir = `${__dirname}/${date}/`
    return getThreadIds()
        .then(threadIds => getMediaLinks(threadIds))
        .then(mediaLinks => filterLinks(mediaLinks))
        .then(async links => {
            const tasks = [];
            await telegram.sendMessage(CHANNEL_ID, `Мемы за ${date}, ебана`)
            tasks.push(new Promise((resolve, reject) => {
                return downloadMemes(links.webm)
                    .then(res => convert(res.filePath, res.fileName))
                    .then(fileName => sendVideo({source: `${dir}${fileName}`}))
                    .then(() => resolve(), error => reject(error));
            }));
            // tasks.push(new Promise(async (resolve, reject) => {
            //     return Promise.map(links.mp4, link => sendVideo(link), {concurrency: 2})
            //         .then(() => resolve(), error => reject(error));
            // }))
            // tasks.push(new Promise(async (resolve, reject) => {
            //     return Promise.map(links.img, link => sendPhoto(link), {concurrency: 2})
            //         .then(() => resolve(), error => reject(error));
            // }))
            return Promise.all(tasks);
        })
        // .then((res) => fs.readdirAsync(dir).then(files => Promise.map(files, file => sendVideo({source: `${dir}${file}`}, {concurrency: 5}))))
        .then((res) => console.log("Finished after %ds", (process.hrtime(hrstart))[0]));
}

run();