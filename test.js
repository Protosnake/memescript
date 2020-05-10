const request = require('request');
const fs = require('fs');
const moment = require('moment');
const HTMLParser = require('node-html-parser');

request("https://2ch.hk/b/catalog.html", function(err, response, body) {
    var root = HTMLParser.parse(body);
    var threads = root.querySelectorAll('div.thread_wrap');
    console.log(body);
});