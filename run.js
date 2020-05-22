const {downloadMemes} = require('./2chClient.js');
const {convert} = require('./convert.js');
const moment = require('moment');
const fs = require('fs');

const hrstart = process.hrtime();
const date = moment().format('YYYY-MM-DD');
const memeFolder = `./${date}`;
const webmFolder = `${memeFolder}/webm`;

if (!fs.existsSync(memeFolder)) {
    fs.mkdirSync(memeFolder);
    fs.mkdirSync(webmFolder);
}

// downloadMemes(args, memeFolder)
// .then(() => {
//     const tasks = [upload('mp4'), convert()];
//     return Promise.all(tasks);
// })
// .then(() => upload('webm'))
// .then(() => console.log('All memes are uploaded'));

async function run() {
    return downloadMemes(memeFolder)
        .then(() => convert(webmFolder))
        .then(() => console.log("Finished after %ds", (process.hrtime(hrstart))[0])); 
}

run();