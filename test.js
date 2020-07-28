const BASE_URL = "https://2ch.hk";
const ARCH = "https://2ch.hk/b/arch/";
const linkSelector = 'figcaption a.desktop';
const threadLinkSelector = "div.pager a";
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
const { link } = require('fs');



// function checkFileSize(link) {
//     // create folder for memes
//     var maxSize = 10485760;

//     return new Promise((resolve, reject) => {
//         return request({
//             url: link,
//             method: "HEAD"
//         }, function(err, headRes) {
//             var size = headRes.headers['content-length'];
//             var fileName = link.slice(-19);
//             var filePath = `/mnt/i/code/memescript/${fileName}`;
//             var file = fs.createWriteStream(filePath);
//             if (size > maxSize) {
//                 console.log('Resource size exceeds limit (' + size + ')');
//             } else {
//                 var file = fs.createWriteStream(filename),
//                     size = 0;
        
//                 var res = request({ url: url });
        
//                 res.on('data', function(data) {
//                     size += data.length;
        
//                     if (size > maxSize) {
//                         console.log('Resource stream exceeded limit (' + size + ')');
        
//                         res.abort(); // Abort the response (close and cleanup the stream)
//                         fs.unlink(filename); // Delete the file we were downloading the data to
//                     }
//                 }).pipe(file);
//             }
//         })
//         .then(() => resolve())
//         .catch(error => reject(error));
// })}

async function checkFileSize(link) {
    // var maxSize = 15728640;
    var maxSize = 10;
    return new Promise((resolve, reject) => request(link, {method: 'HEAD'}).then(res => {
        var size = res['content-length'];
        if (size > maxSize) {
            console.log('too big')
            return false;
        }
        return true;
    }, error => reject(error)));
}


// https://2ch.hk/b/src/225407557/15956976235170.webm

// https://2ch.hk/b/arch/2020-07-26/src/225407557/15956989026110.webm

// https://2ch.hk/b/arch/2020-07-26/src/225407557/15956989412200.webm
checkFileSize("https://2ch.hk/b/arch/2020-07-26/src/225407557/15956989026110.webm");
// checkFileSize("https://2ch.hk/b/src/225407557/15956976235170.webm");