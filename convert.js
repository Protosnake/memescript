const ffmpeg = require('fluent-ffmpeg');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const {
    getMediaLinks, 
    getThreadLinks, 
    filterLinks, 
    downloadMemes, 
    getFailedVideos, 
    logFailure,
    clearFailedLog,
    checkFileSize
    } = require('./2chClient.js');

function checkEmpty(filePath) {
    let fileSize = fs.statSync(filePath).size;
    if (fileSize == 0) {
        return fs.unlinkSync(filePath);
    }
}

module.exports = {
    /**
     * @param  {string} filePath
     * @param  {string} fileName
     * 
     * @return {string} filePath
     */
    convert: (filePath, fileName) => {
        return new Promise((resolve, reject) => {
            console.log(`Converting file ${fileName}`)
            const newFileName = `${fileName.slice(0, -5)}.mp4`;
            const newFilePath = `${filePath.slice(0, -5)}.mp4`;
            ffmpeg(filePath).output(`${filePath.slice(0,-5)}.mp4`)
                .on('error', (error) => {
                    // TODO
                    // logFailure(filePath, error.replace(/[^a-zA-Z0-9]/g, ""));
                    return reject(error.message)
                })
                .on('end', () => {
                    console.log(`Converted ${fileName} into ${newFileName}`);
                    fs.unlinkSync(filePath);
                    console.log(`Removed file ${fileName}`);
                })
                .run();
                return resolve(newFilePath);
            }).catch(err => console.log(err));
    },
};
