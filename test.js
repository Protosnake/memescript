const puppeteer = require('puppeteer');

// async function run() { 
//     const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox','--proxy-server="direct://"','--proxy-bypass-list=*']});
//     const page = await browser.newPage();
//     await page.goto('https://2ch.hk/', {waitUntil: 'domcontentloaded'});
//     await page.waitForTimeout(30000);
//     // await page.waitForSelector('.pagetitle', {timeout: 60000});
//     await page.screenshot({ path: 'example.png'});
  
//     await browser.close();
//     return;
// }

// run();


// resource: http://ktkr3d.github.io/2020/01/27/Puppeteer-on-WSL/

// install puppeteer
// > npm i -g puppeteer

// use chrome from windows: add this to ~/.profile
// PATH=/mnt/c/Program\ Files\ \(x86\)/Google/Chrome/Application:$PATH


const USER_DATA_DIR = 'C:\\temp\\puppeteer_user_data';
const USER_DATA_DIR_WSL = '/mnt/c/temp/puppeteer_user_data';

(async function main() {
    const browser = await puppeteer.launch({
        executablePath: 'chrome.exe',
        userDataDir: USER_DATA_DIR,
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    // locate
    await page.goto('https://www.google.com');

    await page.screenshot({
      path: 'pptr-screenshot.jpg'
    });

    await browser.close();
})();