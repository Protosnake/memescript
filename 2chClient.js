const request = require('request-promise');
const HTMLParser = require('node-html-parser');
// const fs = require('fs');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = require('csv-write-stream');
const { is } = require('bluebird');

const BASE_URL = "https://2ch.hk";
const ARCH = "https://2ch.hk/b/arch/";
const linkSelector = 'figcaption a.desktop';
const threadLinkSelector = "div.pager a";
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";
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
    getThreadLinks: () => {
        let archLink;
        return new Promise((resolve, reject) => request(ARCH)
            .then(res => {
                let root = HTMLParser.parse(res);
                const links = [];
                root.querySelectorAll(threadLinkSelector).forEach(link => links.push(link.getAttribute('href')));
                archLink = links[links.length - 2];
            })
            .then(() => request(BASE_URL + archLink))
            .then(res => {
                let root = HTMLParser.parse(res);
                let threads = root.querySelectorAll(".box-data a");
                let links = Array.from(threads).filter(link => link.text.toLowerCase().includes("webm")).map(a => a.getAttribute("href"));
                return resolve(links);
            })).catch(err => reject(err));
    },
    getFailedVideos: () => {
        const csvPath = __dirname + '/failed.csv';
        const newCsvPath = __dirname + '/retriedFails.csv'
        const failedVideos = {
            links: [],
            files: [],
        };
        return new Promise((resolve, reject) => fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.file.includes('https')) {
                    failedVideos.links.push(row.links);
                } else {
                    failedVideos.files.push(row.file);
                }
            })
            .on('end', () => {
                fs.createReadStream(csvPath).pipe(fs.createWriteStream(newCsvPath));
                return resolve(failedVideos)
            })
            .on('error', (error) => reject(error)));
    },
    logFailure: (file, reason) => {
        const path = './failed.csv';
        let writer = csvWriter({sendHeaders: fs.readFileSync(path).length === 0});
        writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
        writer.write({
            file:file,
            reason: reason,
        });
        writer.end();
    },
    getMediaLinks: (threadLinks) => {
        const mediaLinks = {};
        return new Promise((resolve, reject) => {
            return Promise.all(threadLinks.map((threadLink) => {
                mediaLinks[threadLink.slice(-14)] = [];
                return request(BASE_URL + threadLink).then((res) => {
                    var root = HTMLParser.parse(res);
                    var links = root.querySelectorAll(linkSelector);
                    links.forEach(link => {
                        // mediaLinks.push(link.getAttribute('href'));
                        mediaLinks[threadLink.slice(-14)].push(`${BASE_URL}${link.getAttribute('href')}`);
                    });
                },
                err => console.log(ERR_COLOR, `Could not find media files in ${threadLink} thred due to ${err.statusCode} error code`));
            })).then(() => {
                let total = 0;
                for (let i in mediaLinks) {
                    total = total + mediaLinks[i].length;
                }
                console.log(`Found ${total} media files`);
                return resolve(mediaLinks);
            }, error => reject(error));
        })
    },
    clearFailedLog: () => {
        const failedLog = __dirname + '/failed.csv';
        fs.truncate(failedLog, 0, error => null ? console.log(ERR_COLOR, error) : "");
        console.log("Cleared failed log file");
    },
    /**
     * @param {string} link 
     * 
     * @return {Promise} {filePath: string, fileName: string}
     */
    downloadMemes: async (link) => {
        // create folder for memes
        const date = moment().format('YYYY-MM-DD');
        const memeFolder = date;        
        if (!fs.existsSync(memeFolder)) {
            fs.mkdirSync(memeFolder);
        }
        return new Promise((resolve, reject) => {
                let fileName = link.slice(-19);
                let filePath = `${memeFolder}/${fileName}`;
                let file = fs.createWriteStream(filePath);
                return request(link)
                    .pipe(file)
                    .on('error', (error) => {
                        console.log(ERR_COLOR, error);
                        return reject(error);
                    })
                    .on('finish', async () => {
                        console.log(GOOD_COLOR, `File ${fileName} was downloaded`);
                        return resolve({path: filePath, name: fileName});
                    });
    })},
    checkFileSize: (link) => {
        var maxSize = 15728640;
        return new Promise((resolve, reject) => request(link, {method: 'HEAD'})
            .then(res => {
                var size = res['content-length'];
                return size > maxSize ? reject(`${link} is too large`) : resolve(link);
            })
            .catch(error => reject(error)));
    }
}
