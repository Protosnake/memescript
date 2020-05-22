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
    convert: (filePath, fileName) => {
        return new Promise((resolve, reject) => {
            console.log(`Converting file ${fileName}`)
            const newFileName = `${fileName.slice(0, -5)}.mp4`;
            ffmpeg(filePath).output(`${filePath.slice(0,-5)}.mp4`)
                .on('error', (error) => {
                    return reject(error.message)
                })
                .on('end', () => {
                    console.log(`Converted ${fileName} into ${newFileName}`);
                    fs.unlinkSync(filePath);
                    console.log(`Removed file ${fileName}`);
                    return resolve(newFileName);
                })
                .run();
            }).catch(err => console.log(err));
    },
};
