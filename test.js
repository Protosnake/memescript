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
const threadIdsCsvPath = __dirname + '/threadIds.csv';


function getThreadLinks() {
  return new Promise((resolve, reject) => request(ARCH)
      .then(res => {
          let root = HTMLParser.parse(res);
          let links = [];
          root.querySelectorAll(threadLinkSelector).forEach(link => links.push(link.getAttribute('href')));
          return links[links.length - 2];
      })
      .then((archLink) => request(BASE_URL + archLink))
      .then(res => {
          let root = HTMLParser.parse(res);
          let threads = root.querySelectorAll(".box-data a");
          let threadLinks = Array.from(threads).filter(link => link.text.toLowerCase().includes("webm")).map(a => a.getAttribute("href"));
          return resolve(threadLinks);
      })
      .catch(error => reject(error)))
}

function checkLinks(links) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(threadIdsCsvPath)
      .pipe(csv())
      .on('data', row => {
        links.map(link => {
          if(row.threadId == link) {
            links.splice(links.indexOf(link), 1);
          }
        })
      })
      .on('end', () => {
        return resolve(links);
      })
      .on('error', (error) => reject(error));
  })
}

function saveLinks(links) {
  new Promise((resolve, reject) => {
    let writer = csvWriter({sendHeaders: fs.readFileSync(threadIdsCsvPath).length === 0});
    writer.pipe(fs.createWriteStream(threadIdsCsvPath, {flags: 'a'}));
    links.forEach(link => writer.write({threadId: link}))
    writer.end();
    return resolve(links);
  })
}

getThreadLinks().then(checkLinks).then(saveLinks)