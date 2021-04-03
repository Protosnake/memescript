const puppeteer = require('puppeteer');
const baseUrl = 'https://2ch.hk';

async function run() { 
  const mediaLinks = {};
  const browser = await puppeteer.launch({
    // args: ['--no-sandbox', '--disable-setuid-sandbox','--proxy-server="direct://"','--proxy-bypass-list=*'], 
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
  await page.goto(`${baseUrl}/b/catalog.html`, {waitUntil: 'domcontentloaded'});
  // await page.waitForTimeout(30000);
  await page.waitForSelector('.ctlg__comment');
  await page.screenshot({ path: 'example.png'});
  // const text = await page.evaluate(() => document.querySelectorAll('.ctlg__comment'), els => els);
  // const els = await page.evaluate(() => document.querySelectorAll('.ctlg__comment'))
  // console.log(text[1].textContent)

  // const links = await page.$$eval('.ctlg__comment', els => els.filter(el => el.textContent.toLowerCase().includes('webm')).map(el => el.parentElement.parentElement.querySelector('.ctlg__img a').getAttribute('href')));

  const links = await page.$$eval('.ctlg__comment', els => els.filter(el => /webm|tik tok|mp4|tiktok|тик ток|цуиь|тикток|mp4/.test(el.textContent.toLowerCase())).map(el => el.parentElement.parentElement.querySelector('.ctlg__img a').getAttribute('href')));

  for(link of links) {
    await page.goto(`${baseUrl}${link}`, {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('.post__file-attr a');
    mediaLinks[link] = await page.$$eval('.post__file-attr a', els => els.map(el => el.getAttribute(['href'])).filter(el => /webm|mp4/.test(el)));
    console.log(mediaLinks[link]);
  }

  // await links.forEach(async link => {
  //   await page.goto(`${baseUrl}${link}`, {waitUntil: 'domcontentloaded'});
  //   await page.waitForSelector('.post__file-attr a');
  //   mediaLinks[link] = await page.$$eval('post__file-attr a', els => els.map(el => el.getAttribute(['href']).filter(el => !el.includes('jpg'))));
  //   console.log(mediaLinks[link]);
  // });

  // console.log(els.parentElement.parentElement.querySelector('.ctlg__img a').getAttribute('href'));
  let total = 0;
  for(i in mediaLinks) {
    total = total + mediaLinks[i].length;
  }
  console.log(total);
  await browser.close();
  return mediaLinks;
}

run();

// filter(el => el.textContent.toLowerCase().includes('webm')