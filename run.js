const {
    getMediaLinks, 
    getThreadLinks, 
    filterLinks, 
    downloadMemes, 
    getFailedVideos, 
    logFailure,
    clearFailedLog,
    checkFileSize
    } = require('./2chClient.js');
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
                logFailure(typeof video === 'object' ? video.source.path : video, ` ${error.response.error_code}: ${error.description}`);
            }
        }));
}
function run() {
    let counter = 0;
    const date = moment().format('DD-MM');
    let interval;
    clearFailedLog();
    return getThreadLinks()
        .then(threadLinks => getMediaLinks(threadLinks))
        .then(async mediaLinks => {            
            // сообщаем о начале
            await sendMessage(`мемы за ${date}`);
            
            // постим сообщение каждые 15 мин для навигации
            interval = setInterval(async () => {
                counter++;
                await sendMessage(`${date} ${counter}`)
            }, 600000) // 600000

            // льем каждый тред отдельно
            for (const threadId in mediaLinks) {
                await sendMessage(`Тред номер ${threadId} за ${date}`);
                console.log(`Uploading thread ${threadId}`);
                let filteredLinks = filterLinks(mediaLinks[threadId]);
                let tasks = [];
            
                tasks.push(new Promise((resolve, reject) => {
                    return Promise.map(filteredLinks.webm, async link => {
                        if (await checkFileSize(link)) return resolve();
                        return downloadMemes(link)
                            .then((file) => convert(file.path, file.name))
                            .then((filePath) => sendVideo({source: filePath}))
                            .catch(error => console.log(error))
                    }, {concurrency: 5})
                        .then(() => resolve(), error => reject(error));;
                }));
                tasks.push(new Promise(async (resolve, reject) => {
                    return Promise.map(filteredLinks.mp4, async link => {
                        if (await checkFileSize(link)) return resolve();
                        return sendVideo(link)
                    }, {concurrency: 10})
                        .then(() => resolve(), error => reject(error));
                }))
                await Promise.all(tasks);
            }
        })
        .then(() => getFailedVideos())
        .then((failedVideos) => {
            const tasks = [];
            tasks.push(new Promise((resolve, reject) => {
                return Promise.map(failedVideos.files, link => {
                    return downloadMemes(link)
                        .then((file) => convert(file.path, file.name))
                        .then((filePath) => sendVideo({source: filePath}))
                        .catch(error => console.log(error))
                }, {concurrency: 5})
                    .then(() => resolve(), error => reject(error));;
            }));
            tasks.push(new Promise(async (resolve, reject) => {
                return Promise.map(failedVideos.links, link => sendVideo(link), {concurrency: 10})
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