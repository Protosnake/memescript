const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { chunk } = require('./util.js');

// module.exports = {
//     convert: async (memeFolder) => {
//         fs.readdir(memeFolder, async (err, files) => {
//             const webms = files.filter((file) => file.slice(-4) == 'webm');
//             const chunked_webms = chunk(webms, 3);
//             for (const chunk of chunked_webms) {
//                 for(const webm of chunk) {
//                     await convert(webm, memeFolder).catch(err => console.log(err));
//                 }
//             }
//         });
//     },
// };


module.exports = {
    convert: async (file, memeFolder) => {
        return new Promise((resolve, reject) => {
            const newFileName = `${file.slice(0, -5)}.mp4`;
            console.log(`Converting ${file} into ${newFileName}`);
            ffmpeg(`${memeFolder}/${file}`).output(`${memeFolder}/${newFileName}`)
                .on('error', (error) => {
                    console.log(error);
                    reject(error);
                })
                .on('end', () => {
                    console.log(`Converted ${file} into ${file.slice(0, -5)}.mp4`);
                    fs.unlinkSync(`${memeFolder}/${file}`);
                    console.log(`Removed file ${file}`);
                    resolve(newFileName);
                })
                .run();
            });
        },
};