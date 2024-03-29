const ffmpeg = require('fluent-ffmpeg');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const _ = require('lodash');
const hbjs = require('handbrake-js');
const request = require('request');
const path = require('path');
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";

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
    // convert: (filePath, fileName) => {
    //     return new Promise(async (resolve, reject) => {
    //         console.log(`Converting file ${fileName}`)
    //         const newFileName = `${fileName.slice(0, -5)}.mp4`;
    //         const newFilePath = `${filePath.slice(0, -5)}.mp4`;
    //         ffmpeg(filePath).output(`${filePath.slice(0,-5)}.mp4`)
    //             .on('error', (error) => {
    //                 logFailure(filePath, error.message.replace(/[^a-zA-Z0-9]/g, ""));
    //                 return reject(error.message)
    //             })
    //             .on('end', () => {
    //                 console.log(`Converted ${fileName} into ${newFileName}`);
    //                 fs.unlinkSync(filePath);
    //                 console.log(`Removed file ${fileName}`);
    //                 return resolve(newFilePath);
    //             })
    //             .run();
    //     }).catch(err => console.log(err));
    // },
    convert: file => {
        return new Promise(async (resolve, reject) => {
            const newFileName = `${file.name.slice(0, -5)}.mp4`;
            const newFilePath = `${file.path.slice(0, -5)}.mp4`;
            if (!fs.existsSync(file.path)) reject(`${file.path} doesn't exist`);
            await hbjs.spawn({ input: file.path, output: `${file.path.slice(0, -5)}.mp4` })
                .on('error', err => {
                    console.log(ERR_COLOR, err.message);
                    return reject(err);
                })
                .on('end', () => {
                    console.log(GOOD_COLOR, `Converted ${file.name} into ${newFileName}`);
                    fs.unlink(file.path, error => {
                        if (error) console.log(ERR_COLOR, error);
                        console.log(GOOD_COLOR, `Removed file ${file.name}`);
                    })
                    return resolve(newFilePath);
                })
        }).catch(error => console.log(error));
    },
    checkExistsWithTimeout: (filePath, timeout = 5000) => {
        return new Promise(function (resolve, reject) {
            var dir = path.dirname(filePath);
            var basename = path.basename(filePath);
            var watcher = fs.watch(dir, function (eventType, filename) {
                if (eventType === 'rename' && filename === basename) {
                    clearTimeout(timer);
                    watcher.close();
                    resolve(filePath);
                }
            });
            var timer = setTimeout(function () {
                watcher.close();
                reject(new Error('File did not exists and was not created during the timeout.'));
            }, timeout);
    
            fs.access(filePath, fs.constants.R_OK, function (err) {
                if (!err) {
                    clearTimeout(timer);
                    watcher.close();
                    resolve(filePath);
                }
            });
    
            // var dir = path.dirname(filePath);
            // var basename = path.basename(filePath);
            // var watcher = fs.watch(dir, function (eventType, filename) {
            //     if (eventType === 'rename' && filename === basename) {
            //         clearTimeout(timer);
            //         watcher.close();
            //         console.log('resolving')
            //         resolve(filePath);
            //     }
            // });
        });
    }
};
