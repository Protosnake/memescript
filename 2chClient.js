const request = require('request-promise');
const syncRequest = require('request');
const HTMLParser = require('node-html-parser');
const moment = require('moment');
const csv = require('csv-parser');
const csvWriter = require('csv-write-stream');
const puppeteer = require('puppeteer');
const fs = require('fs');
const BASE_URL = "https://2ch.hk";
const ARCH = "https://2ch.hk/b/arch/";
const linkSelector = 'figcaption a.desktop';
const threadLinkSelector = "div.pager a";
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";
const threadArchivePath = __dirname + '/threadArchive.csv';
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
        return new Promise((resolve, reject) => request(ARCH)
            .then(res => {
                let root = HTMLParser.parse(res);
                let links = [];
                root.querySelectorAll(threadLinkSelector).forEach(link => links.push(link.getAttribute('href')));
                // return links.slice(links.length - 6, -1);
                return links.slice(-1);
            })
            .then(async archLinks => {
                let links = [];
                await Promise.map(archLinks, archLink => request(BASE_URL + archLink)
                    .then(res => {
                        let root = HTMLParser.parse(res);
                        let threads = Array.from(root.querySelectorAll(".box-data a"));
                        // threads.filter(link => (link.text.toLowerCase().includes("webm") && !link.text.toLowerCase().includes("музыкальный")) || link.text.toLowerCase().includes('tik tok')).forEach(t => console.log(t.text))
                        threads
                            .filter(link => link.text.toLowerCase().includes('webm') || link.text.toLowerCase().includes('tik tok') || link.text.toLowerCase().includes('tiktok'))
                            .filter(link => !link.text.toLowerCase().includes('музыкальный') && !link.text.toLowerCase().includes('music') && !link.text.toLowerCase().includes('war') && !link.text.toLowerCase().includes('dark') && !link.text.toLowerCase().includes('ночной'))
                            .map(a => links.push(a.getAttribute("href")));
                    }));
                    // TODO
                    // let keywords = ['tik tok', 'mp4', 'webm', 'tiktok', 'тикток', 'тик', 'ток', 'шебм', 'цуиь', 'мп4'];
                    // let stopwords = ['music', 'war', 'военный', 'музыкальный'];
                return links;
            })
            .then(module.exports.checkLinks)
            .then(resolve)
            .catch(error => reject(error)))
    },
    checkLinks: (links) => {
        return new Promise((resolve, reject) => {
            fs.createReadStream(threadArchivePath)
            .pipe(csv())
            .on('data', row => {
                links.map(link => {
                    if(row.threadId == link) {
                        links.splice(links.indexOf(link), 1);
                    }
                })
            })
            .on('end', () => {
                return resolve(links);
            })
            .on('error', (error) => reject(error));
        })
    },
    saveLink: (link) => {
        return new Promise((resolve, reject) => {
            let writer = csvWriter({sendHeaders: fs.readFileSync(threadArchivePath).length === 0});
            writer.pipe(fs.createWriteStream(threadArchivePath, {flags: 'a'}));
            writer.write({threadId: link});
            writer.end();
            return resolve(link);
        })
    },
    saveThreads: (links) => {
        let writer = csvWriter({sendHeaders: fs.readFileSync(threadArchivePath).length === 0});
        writer.pipe(fs.createWriteStream(threadArchivePath, {flags: 'a'}));
        links.forEach(link => writer.write({threadId: link}))
        writer.end();
    },
    getMediaLinks: async () => {
        const mediaLinks = {};
        const browser = await puppeteer.launch({
          headless: false, // false to show browser
          defaultViewport: null,
        });
        const threadSelector = 'div.box-data a';
        const mediaLinkSelector = '.post__file-attr a';
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
        await page.goto(`${BASE_URL}/b/arch/`, {waitUntil: 'domcontentloaded'});

        await page.waitForSelector(threadSelector);


        const links = await page.$$eval(threadSelector, 
            els => els
                .filter(el => /webm|tik tok|mp4|tiktok|тик ток|цуиь|тикток|mp4/.test(el.textContent.toLowerCase()))
                .filter(el => !(/музыкальный|dark/.test(el.textContent.toLowerCase())))
                .map(el => el.getAttribute('href'))
        );
        // const links = await page.$$eval(commentSelector, els => els.filter(el => /webm|tik tok|mp4|tiktok|тик ток|цуиь|тикток|mp4/.test(el.textContent.toLowerCase())).map(el => el.parentElement.parentElement.querySelector('.ctlg__img a').getAttribute('href')));
      
        for(link of links) {
          await page.goto(`${BASE_URL}${link}`, {waitUntil: 'domcontentloaded'});
          await page.waitForSelector(mediaLinkSelector);
          mediaLinks[link] = await page.$$eval(mediaLinkSelector, (els, BASE_URL) => els.map(el => BASE_URL + el.getAttribute(['href'])).filter(link => /webm|mp4/.test(link)), BASE_URL);
        }
        // const cookies = await page.cookies();
        // global.cookie = `${cookies[0].name}=${cookies[0].value}`;
        await browser.close();
        let total = 0;
        for(i in mediaLinks) {
            total = total + mediaLinks[i].length;
        }
        console.log(`Found ${total} media links in ${Object.keys(mediaLinks).length} threads`);
        return mediaLinks;
    },
    clearFailedLog: () => {
        const failedLog = __dirname + '/failed.csv';
        fs.truncate(failedLog, 0, error => null ? console.log(ERR_COLOR, error) : "");
        console.log("Cleared failed log file");
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
                module.exports.clearFailedLog();
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

        const options = {
            'method': 'GET',
            'headers': {
              'Connection': 'keep-alive',
              'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90"',
              'sec-ch-ua-mobile': '?0',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
              'Accept': '*/*',
              'Sec-Fetch-Site': 'same-origin',
              'Sec-Fetch-Mode': 'no-cors',
              'Sec-Fetch-Dest': 'video',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cookie': global.cookie,
              'Range': 'bytes=0-'
            }
          };
        
        return new Promise((resolve, reject) => {
                let fileName = link.slice(-19);
                let filePath = `${memeFolder}/${fileName}`;
                let file = fs.createWriteStream(filePath);
                return syncRequest(link, options)
                    .on('error', error => reject(error))
                    .pipe(file)
                    .on('error', (error) => {
                        console.log(ERR_COLOR, error);
                        return reject(error);
                    })
                    .on('timeout', error => {
                        console.log(`TIMEOUT ${error}`);
                        return reject(error);
                    })
                    .on('finish', () => {
                        console.log(GOOD_COLOR, `File ${fileName} was downloaded`);
                        return resolve({path: filePath, name: fileName});
                    });
    }).catch(error => console.log(`DOWNLOAD MEMES ERROR: ${error}`))
    },
    checkFileSize: (link) => {
        var maxSize = 15728640;
        return new Promise((resolve, reject) => syncRequest(link, {method: 'HEAD', headers: {'Connection': 'keep-alive'}})
            .on('error', error => {
                console.log(`CHECK SIZE ERROR: ${error}`);
                if(error.code == "ECONNRESET") module.exports.checkFileSize(link);
                return reject(error);
            })
            .on('response', res => {
                var size = res['content-length'];
                return size > maxSize ? reject(`${link} is too large`) : resolve(link);
            }))

    }
}
