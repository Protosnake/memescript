const BASE_URL = "https://2ch.hk";
const ARCH = "https://2ch.hk/b/arch/";
const linkSelector = 'figcaption a.desktop';
const threadLinkSelector = "div.pager a";
const request = require('request-promise');
const HTMLParser = require('node-html-parser');
// const fs = require('fs');
const {
  saveLinks,
  getMediaLinks, 
  getThreadLinks, 
  filterLinks, 
  downloadMemes, 
  getFailedVideos, 
  logFailure,
  clearFailedLog,
  checkFileSize,
  saveThreads,
  } = require('./2chClient.js');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const moment = require('moment');
const ffmpeg = require('fluent-ffmpeg');
const hrstart = process.hrtime();
const _ = require('lodash');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = require('csv-write-stream');
const { link } = require('fs');
const threadIdsCsvPath = __dirname + '/threadIds.csv';
const CHANNEL = require('./channelIds.js');
const TOKEN = CHANNEL.token;
const {convert,checkExistsWithTimeout} = require('./convert.js');
const CHANNEL_ID = CHANNEL.test;
const Telegram = require('telegraf/telegram');
const { errorMonitor } = require('stream');
const { resolve, reject } = require('bluebird');
const telegram = new Telegram(TOKEN);
const caption = '[Толстый движ](https://t.me/joinchat/AAAAAEhqKmKjMfH9YIR85w)';
const WARN_COLOR = "\x1b[33m%s\x1b[0m";
const ERR_COLOR = "\x1b[31m%s\x1b[0m";
const GOOD_COLOR = "\x1b[32m%s\x1b[0m";

