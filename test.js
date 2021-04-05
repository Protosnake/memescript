const fs = require('fs');
const syncRequest = require('request');
const link = 'https://2ch.hk/b/arch/2021-04-04/src/243776542/16175376681150.webm';
// const link  = 'https://2ch.hk/b/arch/2021-04-04/src/243776542/16175374937061.mp4';
const puppeteer = require('puppeteer');
const {convert} = require('./convert');
const Promise = require('bluebird');
const moment = require('moment');


const links = [
  "/b/src/243776542/16175374937232.webm",
  "/b/src/243776542/16175376681150.webm",
  "/b/src/243776542/16175376713010.webm",
  "/b/src/243776542/16175379525550.webm",
  "/b/src/243776542/16175382307130.webm",
  "/b/src/243776542/16175384891470.webm",
  "/b/src/243776542/16175385297050.webm",
  "/b/src/243776542/16175388680370.webm",
  "/b/src/243776542/16175398615890.webm",
  "/b/src/243776542/16175399426250.webm",
  "/b/src/243776542/16175402264660.webm",
  "/b/src/243776542/16175402604380.webm",
  "/b/src/243776542/16175402743170.webm",
  "/b/src/243776542/16175403005020.webm",
  "/b/src/243776542/16175404746940.webm",
  "/b/src/243776542/16175415287870.webm",
  "/b/src/243776542/16175425634280.webm",
  "/b/src/243776542/16175453780810.webm",
  "/b/src/243776542/16175465606050.webm"
];

async function download(link) {
  // create folder for memes
  const memeFolder = '2021-04-05';        
  if (!fs.existsSync(memeFolder)) {
      fs.mkdirSync(memeFolder);
  }
  // const browser = await puppeteer.launch({
  //   headless: false, // false to show browser
  //   defaultViewport: null,
  // });
  // const page = await browser.newPage();
  // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  // await page.goto(link, {waitUntil: 'domcontentloaded'});
  // await page.waitForSelector(threadSelector);

  // const links = await page.$$eval(threadSelector, els => els.filter(el => /webm|tik tok|mp4|tiktok|тик ток|цуиь|тикток|mp4/.test(el.textContent.toLowerCase())).map(el => el.getAttribute('href')));
  // const links = await page.$$eval(commentSelector, els => els.filter(el => /webm|tik tok|mp4|tiktok|тик ток|цуиь|тикток|mp4/.test(el.textContent.toLowerCase())).map(el => el.parentElement.parentElement.querySelector('.ctlg__img a').getAttribute('href')));

  let options = {
    'method': 'GET',
    'headers': {
      'Connection': 'keep-alive',
      'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90"',
      'sec-ch-ua-mobile': '?0',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4427.0 Safari/537.36',
      'Accept': '*/*',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Dest': 'video',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': '07IFkGaPtry7mAxrnFzTs7kG=f1cc5845-e1d6-48cf-ba1b-a1d3aa2834b0',
      'Range': 'bytes=0-'
    }
  };

  // return request(link, options).then(res => fs.createWriteStream(filePath).pipe(res)).catch(err => console.log(err));

  return new Promise((resolve, reject) => {
          let fileName = link.slice(-19);
          let filePath = `${memeFolder}/${fileName}`;
          let file = fs.createWriteStream(filePath);
          return syncRequest(link, options)
              .on('error', error => reject(error))
              .pipe(file)
              .on('error', async (error) => {
                  console.log(ERR_COLOR, error);
                  return reject(error);
              })
              .on('timeout', error => {
                  console.log(`TIMEOUT ${error}`);
                  return reject(error);
              })
              .on('finish', () => {
                  console.log(`File ${fileName} was downloaded`);
                  return resolve({path: filePath, name: fileName});
              });
  }).catch(error => console.log(`DOWNLOAD MEMES ERROR: ${error}`));
}

// function test() {
//   // create folder for memes
//   const memeFolder = '2021-04-05';        
//   if (!fs.existsSync(memeFolder)) {
//       fs.mkdirSync(memeFolder);
//   }

//   return new Promise((resolve, reject) => {
//           let fileName = link.slice(-19);
//           let filePath = `${memeFolder}/${fileName}`;
//           let file = fs.createWriteStream(filePath);
//           return syncRequest(link)
//               .on('error', error => reject(error))
//               .pipe(file)
//               .on('data', (data) => {
//                 console.log(data)
//               })
//               .on('error', async (error) => {
//                   console.log(ERR_COLOR, error);
//                   return reject(error);
//               })
//               .on('timeout', error => {
//                   console.log(`TIMEOUT ${error}`);
//                   return reject(error);
//               })
//               // .on('finish', () => {
//               //     console.log(`File ${fileName} was downloaded`);
//               //     return resolve({path: filePath, name: fileName});
//               // });
//   }).catch(error => console.log(`DOWNLOAD MEMES ERROR: ${error}`));
// }

// test();

(async function main() {
  try {
    const browser = await puppeteer.launch({
      headless: false, // false to show browser
      defaultViewport: null,
    });
    const [page] = await browser.pages();

    await page.goto('https://2ch.hk/b/arch/');
    await page.waitForSelector('.box-data');

    const cookies = await page.cookies();
    console.log(cookies[0].name, cookies[0].value);
    // const cdp = await page.target().createCDPSession();
    // const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });
    // fs.writeFileSync('page.mhtml', data);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
});

async function main() {
  const o = {
    'thread1': links,
    'thread2': links,
    'thread3': links
  }

  for(const id in o) {


    await Promise.map(o[id], link => test(`https://2ch.hk${link}`).then(convert), {concurrency: 3});
  // var file = await download().then(convert);
  // console.log(file);
  }
}


async function test(link) {
  console.log('downloading')
  // create folder for memes
  const date = moment().format('YYYY-MM-DD');
  const memeFolder = date;        
  if (!fs.existsSync(memeFolder)) {
      fs.mkdirSync(memeFolder);
  }

  const browser = await puppeteer.launch({
      headless: true, // false to show browser
      defaultViewport: null,
    });
  const videoSelector = 'video';
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.goto(`${link}`, {waitUntil: 'domcontentloaded'});

  await page.waitForSelector(videoSelector);
  const cookies = await page.cookies();
  const cookie = `${cookies[0].name}=${cookies[0].value}`;
  await page.close()

  const options = {
      'method': 'GET',
      'headers': {
        'Connection': 'keep-alive',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90"',
        'sec-ch-ua-mobile': '?0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
        'Accept': '*/*',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Dest': 'video',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': cookie,
        'Range': 'bytes=0-'
      }
    };
  
  return new Promise((resolve, reject) => {
          let fileName = link.slice(-19);
          let filePath = `${memeFolder}/${fileName}`;
          let file = fs.createWriteStream(filePath);
          return syncRequest(link, options)
              .on('error', error => reject(error))
              .pipe(file)
              .on('error', async (error) => {
                  console.log(ERR_COLOR, error);
                  return reject(error);
              })
              .on('timeout', error => {
                  console.log(`TIMEOUT ${error}`);
                  return reject(error);
              })
              .on('finish', () => {
                  console.log(`File ${fileName} was downloaded`);
                  return resolve({path: filePath, name: fileName});
              });
})
}

// test(link);
// fetch("https://2ch.hk/b/arch/2021-04-04/src/243776542/16175376681150.webm", {
//   "headers": {
//     "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
//     "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
//     "cache-control": "max-age=0",
//     "if-modified-since": "Sun, 04 Apr 2021 16:10:00 GMT",
//     "if-none-match": "\"6069e4d8-299d3e\"",
//     "range": "bytes=0-2727229",
//     "sec-ch-ua": "\"Google Chrome\";v=\"89\", \"Chromium\";v=\"89\", \";Not A Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-fetch-dest": "document",
//     "sec-fetch-mode": "navigate",
//     "sec-fetch-site": "none",
//     "sec-fetch-user": "?1",
//     "upgrade-insecure-requests": "1",
//     "cookie": "_ga=GA1.2.1150385868.1617445031; 07IFkGaPtry7mAxrnFzTs7kG=cd86bac4-2aaa-453f-b5b3-b1f7e12340ba; _gid=GA1.2.1758964413.1617612185"
//   },
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": null,
//   "method": "GET",
//   "mode": "cors"
// });

main()