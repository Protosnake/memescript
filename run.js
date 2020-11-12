const {
    saveLink,
    getMediaLinks, 
    getThreadLinks, 
    filterLinks, 
    downloadMemes, 
    getFailedVideos, 
    logFailure,
    clearFailedLog,
    checkFileSize,
    } = require('./2chClient.js');
const {convert, checkExistsWithTimeout} = require('./convert.js');
const CHANNEL = require('./channelIds.js');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = Promise.promisifyAll(require('fs'));
const TOKEN = CHANNEL.token;
const Telegram = require('telegraf/telegram');
const telegram = new Telegram(TOKEN);
const moment = require('moment');
const { resolve, reject } = require('bluebird');
const { link } = require('fs');
const { errorMonitor } = require('stream');
const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";

const CHANNEL_ID = CHANNEL.id;

let currentThreadId;

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
                // ебучие видео где-то переназначается и становится ReadStream, следственно вот 
                if (typeof video === "object") video = backupVideo
                await sendVideo(video, retry_after * 1000);
            } else if (error.response.description.includes("no video")) {
                console.log(WARN_COLOR, `Retrying ${video.source} Reason: ${error.response.description}`)
                await sendVideo(video);
            } else {
                console.log(ERR_COLOR, error.response.description); // может тута
            }
        }));
}

function run() {
    const date = moment().format('DD-MM');
    process.on('unhandledRejection', (reason, promise) => {
        console.warn('Unhandled promise rejection:', promise, 'reason:', reason.stack || reason);
    });
    return getThreadLinks()
        .then(getMediaLinks)
        .then(async mediaLinks => {            
            // сообщаем о начале
            await sendMessage(`мемы за ${date}`);
            // льем каждый тред отдельно
            for (const threadId in mediaLinks) {
                await sendMessage(`Тред номер ${threadId} за ${date}`);
                currentThreadId = threadId;
                console.log(`Uploading thread ${threadId}`);
                // let filteredLinks = filterLinks(mediaLinks[threadId]);
                // let tasks = [];
                
                await Promise.map(mediaLinks[threadId], link => checkFileSize(link)
                    .then(async link => {
                        if(link.includes('webm')) {
                            await downloadMemes(link)
                                .then(file => convert(file.path, file.name))
                                .then(filePath => checkExistsWithTimeout(filePath))
                                .then(filePath => sendVideo({source: filePath}))
                        } else {
                            await sendVideo(link).catch(error => console.log(ERR_COLOR, error));
                        }
                    }).catch(error => console.log(ERR_COLOR, error)), 
                {concurrency: 15}).then(() => saveLink(threadId));
            }
        })
        .then(() => {
            console.log("Finished after %ds", (process.hrtime(hrstart))[0]);
            process.exit(0);
        })
        .catch(error => console.log(ERR_COLOR, error));
}

run();
