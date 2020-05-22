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

module.exports = {
    filterLinks: (mediaLinks) => {
        const links = {
            webm: [],
            mp4: [],
            img: [],
        }
        mediaLinks.forEach(mediaLink => {
            switch (mediaLink.slice(-4)) {
                case 'webm':
                    links.webm.push(mediaLink);
                    break;
                case '.mp4':
                    links.mp4.push(mediaLink);
                    break;
                default:
                    // assuming everything else are images
                    links.img.push(mediaLink);        
                    break;
            }
        })
        return links;
    },
    getThreadIds: () => {
        const threadIds = []
        return new Promise((resolve, reject) => fs.createReadStream(__dirname + '/threadIds.csv')
            .pipe(csv())
            .on('data', (row) => {
                threadIds.push(row.threadId);
            })
            .on('end', () => resolve(threadIds))
            .on('error', (error) => reject(error)));
    },
    getMediaLinks: (threadIds) => {
        const mediaLinks = [];
        return new Promise((resolve, reject) => {
            return Promise.all(threadIds.map((threadId) => {
                return request(`${BASE_URL}${threadId}`).then((res) => {
                    var root = HTMLParser.parse(res);
                    var links = root.querySelectorAll(linkSelector);
                    links.forEach(link => {
                        // mediaLinks.push(link.getAttribute('href'));
                        mediaLinks.push(`${BASE_URL}${link.getAttribute('href')}`);
                    });
                },
                err => console.log(`Could find media files in ${threadId} thred due to ${err.statusCode} error code`));
            })).then(() => {
                console.log(`Found ${mediaLinks.length} media files`);
                resolve(mediaLinks);
            }, error => reject(error));
        })
        
    },
    downloadMemes: async (mediaLinks) => {
        // create folder for memes
        const date = moment().format('YYYY-MM-DD');
        const memeFolder = date;
        console.log(`Downloading memes for ${date}`);
        
        if (!fs.existsSync(memeFolder)) {
            fs.mkdirSync(memeFolder);
        }
        return new Promise((resolve, reject) => {
            return Promise.map(mediaLinks, link => {
                let fileName = link.slice(-19);
                let filePath = `${memeFolder}/${fileName}`;
                let file = fs.createWriteStream(filePath);
                return new Promise((resolve, reject) => {
                    return request(link)
                        .pipe(file)
                        .on('error', (error) => {
                            console.log(error);
                            return reject(error);
                        })
                        .on('finish', async () => {
                            console.log("\x1b[32m%s\x1b[0m", `File ${fileName} was downloaded`);
                            return resolve();
                        });
                    });
                }, {concurrency: 3}).then(() => resolve({filePath: filePath, fileName: fileName}), (error) => reject(error));
        });
    }
}
