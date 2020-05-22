const request = require('request-promise');
const HTMLParser = require('node-html-parser');
// const fs = require('fs');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const {convert} = require('./convert.js');
const csv = require('csv-parser');


const BASE_URL = "https://2ch.hk";
const linkSelector = 'figcaption a.desktop';
// const linkSelector = '#posts-form .thread div div div.post__images figure figcaption a.desktop';

async function getThreadIds() {
    const threadIds = []
    return new Promise((resolve, reject) => fs.createReadStream(__dirname + '/threadIds.csv')
        .pipe(csv())
        .on('data', (row) => {
            threadIds.push(row.threadId);
        })
        .on('end', () => resolve(threadIds))
        .on('error', (error) => reject(error)));
}

async function getLinks(threadIds) {
    const mediaLinks = [];
    await Promise.all(threadIds.map((threadId) => {
        return request(`${BASE_URL}${threadId}`).then((res) => {
            var root = HTMLParser.parse(res);
            var links = root.querySelectorAll(linkSelector);
            links.forEach(link => {
                mediaLinks.push(link.getAttribute('href'));
            });
        },
        err => console.log(`Could find media files in ${threadId} thred due to ${err.statusCode} error code`));
    })).then(() => console.log(`Found ${mediaLinks.length} media files`));;
    return mediaLinks;
}

module.exports = {
    downloadMemes: async (memeFolder) => {
        const threadIds = await getThreadIds();
        // create folder for memes
        const date = moment().format('YYYY-MM-DD');
        console.log(`Downloading memes for ${date}`);
        const webmFolder = `${memeFolder}/webm`;
        
        if (!fs.existsSync(memeFolder)) {
            fs.mkdirSync(memeFolder);
            fs.mkdirSync(webmFolder);
        }

        const mediaLinks = await getLinks(threadIds);
        return new Promise((resolve, reject) => {
            return Promise.map(mediaLinks, link => {
                let fileName = link.slice(17);
                let filePath = link.slice(-4) == 'webm' ? `${webmFolder}/${fileName}` : `${memeFolder}/${fileName}`;
                let file = fs.createWriteStream(filePath);
                return new Promise((resolve, reject) => {
                    return request(BASE_URL + link)
                        .pipe(file)
                        .on('error', (error) => {
                            console.log(error);
                            return reject(error);
                        })
                        .on('finish', () => {
                            console.log("\x1b[32m%s\x1b[0m", `File ${fileName} was downloaded`);
                            return resolve();
                        });
                    });
                }, {concurrency: 10}).then(() => resolve(), (error) => reject(error));
        });
    }
}
