const request = require('request');
const HTMLParser = require('node-html-parser');
const fs = require('fs');
const moment = require('moment');


const BASE_URL = "https://2ch.hk";
// const linkSelector = '#posts-form .thread div div div.post__images figure figcaption a.desktop';
const linkSelector = 'figcaption a.desktop';

const myArgs = process.argv.slice(2);
if (myArgs.length == 0) {
    throw new Error('Please provide thread id');
}
if (!Array.isArray(myArgs[0])) {
    throw new Error('Argument should be array of thread ids');
}
const threadId = myArgs[0];


const mediaLinks = [];
// create folder for memes
const date = moment().format('DD-MM-yyyy-HH-mm');
console.log(`Downloading memes for ${date}`);
const memeFolder = `./${date}`;
if (!fs.existsSync(memeFolder)) {
    fs.mkdirSync(memeFolder);
}


request(`${BASE_URL}/b/res/${threadId}.html`, function (error, response, body) {
    var root = HTMLParser.parse(body);
    var links = root.querySelectorAll(linkSelector);
    links.forEach(link => {
        mediaLinks.push(link.getAttribute('href'));
    });
    console.log(`Found ${mediaLinks.length} media files`)
    Promise.all(mediaLinks.map(link => {
        return new Promise((resolve, reject) => {
            let file = fs.createWriteStream(`${memeFolder}/${link.slice(17)}`);
            let stream = request(BASE_URL + link)
            .pipe(file)
            .on('finish', () => {
                console.log("\x1b[32m%s\x1b[0m", `File ${link.slice(17)} was downloaded`);
                resolve();
            })
            .on('error', (error) =>{
                console.log(error);
            })
        })
        .catch(error => {
            console.log(`Something really weird happened: ${error}`);
        });
    }))
    .then(res => console.log(`${mediaLinks.length} media files downloaded successfully`),
    err => console.log(err));
});