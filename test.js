const {getThreadIds, getMediaLinks, filterLinks, downloadMemes, getFailedVideos, logFailure} = require('./2chClient.js');
const {convert} = require('./convert.js');
const CHANNEL = require('./channelIds.js');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const TOKEN = '1281981211:AAF1aGYUggPy3OKWBqfd4FcBo_jxhNmw3Ek';
const CHANNEL_ID = CHANNEL.test;
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const moment = require('moment');
const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';


const hrstart = process.hrtime();

async function sendMessage(text, time = 0) {
    return Promise.delay(time)
        .then(() => telegram.sendMessage(CHANNEL_ID, text))
        .catch(async error => {
            if (error.response.error_code === 429) {
                console.log(error.response.description);
                let retry_after = error.response.parameters.retry_after;
                await sendMessage(text, retry_after * 1000);
            } else {
                console.log("\x1b[31m%s\x1b[0m", `${error.response.description}`);
            }
        });
}


// video can be link or a buffer
async function sendVideo(video, time = 0) {
    return Promise.delay(time).then(() => telegram.sendVideo(CHANNEL_ID, video, {supports_streaming: true, caption})
        .then(() => console.log("\x1b[32m%s\x1b[0m" ,`${typeof video === 'object' ? 'A local file ' + video.source.path : video} uploaded successfully`))
        .catch(async error => {
            if (error.response.error_code === 429) {
                console.log(error.response.description);
                let retry_after = error.response.parameters.retry_after;
                await sendVideo(video, retry_after * 1000);
            } else {
                console.log("\x1b[31m%s\x1b[0m", `${error.response.description}`);
                logFailure(typeof video === 'object' ? JSON.stringify(video.source.path) : video, ` ${error.response.error_code}: ${error.description}`);
            }
        }));
}
function run() {
    let counter = 0;
    const date = moment().format('MM-DD');
    const dir = `${__dirname}/${date}/`;
    let interval;
    return getThreadIds()
        .then(threadIds => getMediaLinks(threadIds))
        .then(mediaLinks => filterLinks(mediaLinks))
        .then(async links => {
            const tasks = [];
            await sendMessage(`мемы за ${date}`);
            interval = setInterval(async () => {
                counter++;
                await sendMessage(`${date} ${counter}`)
            }, 600000) // 600000
            tasks.push(new Promise((resolve, reject) => {
                return Promise.map(links.webm.slice(-5), link => {
                    return downloadMemes(link)
                        .then((file) => convert(file.path, file.name))
                        .then((filePath) => sendVideo({source: filePath}))
                        .catch(error => console.log(error))
                }, {concurrency: 2})
                    .then(() => resolve(), error => reject(error));;
            }));
            tasks.push(new Promise(async (resolve, reject) => {
                return Promise.map(links.mp4.slice(-5), link => sendVideo(link), {concurrency: 4})
                    .then(() => resolve(), error => reject(error));
            }))
            return Promise.all(tasks);
        })
        .then(() => getFailedVideos())
        .then((failedVideos) => {
            const tasks = [];
            tasks.push(new Promise((resolve, reject) => {
                return Promise.map(failedVideos.files.slice(-5), link => {
                    return downloadMemes(link)
                        .then((file) => convert(file.path, file.name))
                        .then((filePath) => sendVideo({source: filePath}))
                        .catch(error => console.log(error))
                }, {concurrency: 2})
                    .then(() => resolve(), error => reject(error));;
            }));
            tasks.push(new Promise(async (resolve, reject) => {
                return Promise.map(failedVideos.links.slice(-5), link => sendVideo(link), {concurrency: 4})
                    .then(() => resolve(), error => reject(error));
            }))
            return Promise.all(tasks);
        })
        .then((res) => {
            clearInterval(interval);
            console.log("Finished after %ds", (process.hrtime(hrstart))[0])
        });
}
run();