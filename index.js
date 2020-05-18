const request = require('request-promise');
const HTMLParser = require('node-html-parser');
const fs = require('fs');
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const {convert} = require('./convert.js');


function downloadMemes() {
    const BASE_URL = "https://2ch.hk";
    // const linkSelector = '#posts-form .thread div div div.post__images figure figcaption a.desktop';
    const linkSelector = 'figcaption a.desktop';

    const myArgs = process.argv.slice(2);
    if (myArgs.length == 0) {
        throw new Error('Please provide thread id');
    }
    const threadIds = myArgs;

    const mediaLinks = [];
    // create folder for memes
    const time = moment().format('HH:mm:ss')
    const date = moment().format('YYYY-MM-DD');
    console.log(`Downloading memes for ${date}`);
    const memeFolder = `./${date}`;
    const webmFolder = `${memeFolder}/webm`;
    
    if (!fs.existsSync(memeFolder)) {
        fs.mkdirSync(memeFolder);
        fs.mkdirSync(webmFolder);
    }

    return Promise.all(threadIds.map((threadId) => {
        return request(`${BASE_URL}${threadId}`).then((res) => {
            var root = HTMLParser.parse(res);
            var links = root.querySelectorAll(linkSelector);
            links.forEach(link => {
                mediaLinks.push(link.getAttribute('href'));
            });
        },
        err => console.log(`Could find media files in ${threadId} thred due to ${err.statusCode} error code`));
    }))
    .then(() => console.log(`Found ${mediaLinks.length} media files`))
    .then(() => {
        return Promise.all(mediaLinks.map(link => {
            let fileName = link.slice(17);
            let filePath = link.slice(-4) == 'webm' ? `${webmFolder}/${fileName}` : `${memeFolder}/${fileName}`;
            let file = fs.createWriteStream(filePath);
            return request(BASE_URL + link)
                .pipe(file)
                .on('finish', () => console.log("\x1b[32m%s\x1b[0m", `File ${fileName} was downloaded`))
                .on('error', (error) => console.log(error))
        }), {
            concurrency: 5,
        }).catch(err => console.log(err));
    })
    .then(() => {console.log('TODO upload to gdrive')})
    .then(() => {
        
    })
    // .then(() => {
    //     const chunkedMedia = chunk(mediaLinks, 5);
    //     for (const links of chunkedMedia) {
    //         return Promise.all(links.map(link => {
    //             return new Promise((resolve, reject) => {
    //                 let fileName = link.slice(17);
    //                 let filePath = `${memeFolder}/${fileName}`;
    //                 let file = fs.createWriteStream(filePath);
    //                 request(BASE_URL + link)
    //                 .pipe(file)
    //                 .on('finish', async () => {
    //                     console.log("\x1b[32m%s\x1b[0m", `File ${fileName} was downloaded`);
    //                     resolve(fileName);
    //                 })
    //                 .on('error', (error) =>{
    //                     console.log(error);
    //                 })
    //             })
    //             .then((fileName) => {
    //                 if(fileName.slice(-4) == 'webm') {
    //                     return convert(fileName, memeFolder);
    //                 }
    //                 return;
    //             })
    //         }));
    //     } 
    // })
}

downloadMemes();
// console.log("Finished after %ds", (process.hrtime(hrstart))[0]);