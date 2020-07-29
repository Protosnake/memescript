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
const _ = require('lodash');
const fs = Promise.promisifyAll(require('fs'));
const TOKEN = CHANNEL.token;
const CHANNEL_ID = CHANNEL.test;
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const moment = require('moment');
const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";


const hrstart = process.hrtime();

async function sendMessage(text, time = 0) {
    return Promise.delay(time)
        .then(() => telegram.sendMessage(CHANNEL_ID, text))
        .catch(async error => {
            if (error.response.error_code === 429) {
                console.log(WARN_COLOR, error.response.description);
                let retry_after = error.response.parameters.retry_after;
                await sendMessage(text, retry_after * 1000);
            } else {
                console.log(ERR_COLOR, `${error.response.description}`);
            }
        });
}

// video can be link or a buffer
async function sendVideo(video, time = 0) {
    let backupVideo = _.cloneDeep(video);
    return Promise.delay(time).then(() => telegram.sendVideo(CHANNEL_ID, video, {supports_streaming: true, caption})
        .then(() => console.log(GOOD_COLOR, `${typeof video === 'object' ? 'A local file ' + video.source.path : video} uploaded successfully`))
        .catch(async error => {
            if (error.response.error_code === 429) {
                console.log(WARN_COLOR, error.response.description);
                let retry_after = error.response.parameters.retry_after;
                // TODO
                if (typeof video === "object") video = backupVideo
                console.log(video);
                await sendVideo(video, retry_after * 1000);
            } else {
                console.log(ERR_COLOR, `${error.response.description}`);
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
                
                // обрабатываем вебм
                tasks.push(new Promise((resolve, reject) => {
                    return Promise.map(filteredLinks.webm, link => checkFileSize(link)
                        .then(link => downloadMemes(link)
                                .then(file => convert(file.path, file.name))
                                .then(filePath => sendVideo({source: filePath}))
                                .catch(error => console.log(ERR_COLOR, error)),
                            error => console.log(WARN_COLOR, error))
                        , {concurrency: 10}).then(() => resolve(), error => reject(error));
                }));

                // обрабатываем mp4
                tasks.push(new Promise((resolve, reject) => {
                    return new Promise.map(filteredLinks.mp4, link => checkFileSize(link)
                        .then(link => sendVideo(link), error => console.log(WARN_COLOR, error))
                        .catch(error => console.log(ERR_COLOR, error))
                    , {concurrency: 5}).then(() => resolve(), error => reject(error));
                }));
                await Promise.all(tasks);
            }
        })
        .then(() => getFailedVideos())
        .then((failedVideos) => {
            const tasks = [];
            tasks.push(new Promise((resolve, reject) => {
                return Promise.map(failedVideos.links, link => {
                    return downloadMemes(link)
                        .then((file) => convert(file.path, file.name))
                        .then((filePath) => sendVideo({source: filePath}))
                        .catch(error => console.log(ERR_COLOR, error))
                }, {concurrency: 5})
                    .then(() => resolve(), error => reject(error));;
            }));
            tasks.push(new Promise(async (resolve, reject) => {
                return Promise.map(failedVideos.files, file => sendVideo({source: file}), {concurrency: 5})
                    .then(() => resolve(), error => reject(error));
            }))
            return Promise.all(tasks);
        })
        .then((res) => {
            clearInterval(interval);
            console.log("Finished after %ds", (process.hrtime(hrstart))[0]);
            process.exit(0);
        });
}

run();