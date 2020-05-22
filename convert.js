const ffmpeg = require('fluent-ffmpeg');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');

function checkEmpty(filePath) {
    let fileSize = fs.statSync(filePath).size;
    if (fileSize == 0) {
        return fs.unlinkSync(filePath);
    }
}

module.exports = {
    convert: (webmFolder) => {
        return fs.readdirAsync(webmFolder).map(file => {
                let filePath = `${webmFolder}/${file}`;
                checkEmpty(filePath);
                if (file.slice(-3) == 'mp4') {
                    return;
                }
                return new Promise((resolve, reject) => {
                    const newFileName = `${file.slice(0, -5)}.mp4`;
                    console.log(`Converting ${file} into ${newFileName}`);
                    ffmpeg(filePath).output(`${webmFolder}/${newFileName}`)
                        .on('error', (error) => {
                            return reject(error.message)
                        })
                        .on('end', () => {
                            console.log(`Converted ${file} into ${file.slice(0, -5)}.mp4`);
                            fs.unlinkSync(filePath);
                            console.log(`Removed file ${file}`);
                            return resolve(newFileName);
                        })
                        .run();
                    }).catch(err => console.log(err));
            }, {concurrency: 3});
    },
};
