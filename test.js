const request = require('request');
const fs = require('fs');
const moment = require('moment');
const HTMLParser = require('node-html-parser');

const ffmpeg = require('fluent-ffmpeg');


const memeFolder = `2020-05-18`;
fs.readdir(memeFolder, async (err, files) => {
    const webms = files.filter((file) => file.slice(-4) == 'webm');
    const chunked_webms = chunk(webms, 3);
    for (const chunk of chunked_webms) {
        for(const webm of chunk) {
            await convert(webm).catch(err => console.log(err));
        }
    }
});

function chunk(array, size) {
    const chunked_arr = [];
    let copied = [...array]; // ES6 destructuring
    const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
    for (let i = 0; i < numOfChild; i++) {
      chunked_arr.push(copied.splice(0, size));
    }
    return chunked_arr;
  }


async function convert(file) {
    return new Promise((resolve, reject) => {
        console.log(`Converting ${file} into ${file.slice(0, -5)}.mp4`);
        ffmpeg(`${memeFolder}/${file}`).output(`${memeFolder}/${file.slice(0, -5)}.mp4`)
            .on('error', (error) => {
                console.log(`Something really weird happened: ${error}`);
                reject(error);
            })
            .on('end', () => {
                console.log(`Converted ${file} into ${file.slice(0, -5)}.mp4`);
                fs.unlinkSync(`${memeFolder}/${file}`);
                console.log(`Removed file ${file}`);
                resolve();
            })
            .run();
        });
}
// async function convertVideo (file) {
//     ffmpeg(`${memeFolder}/${file}`).output(`${memeFolder}/${file.slice(0, -5)}.mp4`)
//                 .on('error', (error) => {
//                     console.log(`Something really weird happened: ${error}`);
//                 })
//                 .on('end', () => {
//                     console.log(`Converted ${file} into ${file.slice(0, -5)}.mp4`);
//                     fs.unlinkSync(`${memeFolder}/${file}`);
//                     console.log(`Removed file ${file}`);
//                 })
//                 .run();
//     return;                
// }




// convert.addInput('15891073901460.webm').output('out.mp4').run();