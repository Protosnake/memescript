const request = require('request');
const HTMLParser = require('node-html-parser');
const fs = require('fs');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const {convert} = require('./convert.js');
const {chunk} = require('./util.js');


const BASE_URL = "https://2ch.hk";
// const linkSelector = '#posts-form .thread div div div.post__images figure figcaption a.desktop';
const linkSelector = 'figcaption a.desktop';

const myArgs = process.argv.slice(2);
if (myArgs.length == 0) {
    throw new Error('Please provide thread id');
}
const threadId = myArgs[0];


const mediaLinks = [];
// create folder for memes
const time = moment().format('HH:mm:ss')
const date = moment().format('YYYY-MM-DD');
console.log(`Downloading memes for ${date}`);
const memeFolder = `./${date}`;
if (!fs.existsSync(memeFolder)) {
    fs.mkdirSync(memeFolder);
}


request(`${BASE_URL}${threadId}`, async function (error, response, body) {
    var root = HTMLParser.parse(body);
    var links = root.querySelectorAll(linkSelector);
    links.forEach(link => {
        mediaLinks.push(link.getAttribute('href'));
    });
    console.log(`Found ${mediaLinks.length} media files`);
    const chunkedMedia = chunk(mediaLinks, 10);
    for (const links of chunkedMedia) {
        await Promise.all(links.map(link => {
            return new Promise((resolve, reject) => {
                let fileName = link.slice(17);
                let filePath = `${memeFolder}/${fileName}`;
                let file = fs.createWriteStream(filePath);
                request(BASE_URL + link)
                .pipe(file)
                .on('finish', async () => {
                    console.log("\x1b[32m%s\x1b[0m", `File ${fileName} was downloaded`);
                    resolve(fileName);
                })
                .on('error', (error) =>{
                    console.log(error);
                })
            })
            .then(async (fileName) => {
                if(fileName.slice(-4) == 'webm') {
                    return await convert(fileName, memeFolder);
                }
                return;
            })
        }));
    }
    console.log("Finished after %ds", (process.hrtime(hrstart))[0]);
});