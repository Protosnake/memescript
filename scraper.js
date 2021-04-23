const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');


async function run() {
    const emailSelector = '#edit-name';
    const passSelector = '#edit-pass';
    const submitButtonSelector = '#edit-submit';
    const nextPageSelector = '#block-system-main > div.row.main-area.row-main-content > div.col-md-12 > div > div.col-md-9 > div.panel-pane.pane-views-panes.pane-search-candidates-panel-pane-1 > div > div > div.text-center > ul > li.next > a';
    const email = 'anastasiiaivanova2704@gmail.com'
    const pass = 'galeri67'
    const selectors = {
        phoneIcon: '.fa-phone',
        emailIcon: '.fa-envelope',
        linkedInIcon: '.fa-linkedin',
        telegramIcon: 'img[src="https://app.turbohiring.co/sites/default/files/contacts_icons/7f4533c10e9af841e7091e4dbcf5da77.png"]',
        skypeIcon: '.fa-skype',
        facebookIcon: '.fa-facebook-square',
        candidate: 'article',
        name: 'h3',
        dataAttribute: 'data-hr-profile-copy-link-text',
        experience: '.contact-teaser-item.row:nth-child(2) .col-md-9',
        skills: '.contact-teaser-item.row:nth-child(3) .col-md-9',
    }

    const browser = await puppeteer.launch({
        headless: false, // false to show browser
        defaultViewport: null,
        args: [
            '--proxy-server="direct://"',
            '--proxy-bypass-list=*'
        ]
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
    await page.goto(`https://app.turbohiring.co/uk/user/login`);

    await page.waitForSelector(emailSelector);
    await (await page.$(emailSelector)).type(email);
    await (await page.$(passSelector)).type(pass);
    await page.click(submitButtonSelector);
    
    await page.waitForSelector(selectors.candidate);
    let currentUrl = await page.url();
    let offset = 1641;

    let pagesNum = 22195 - offset;


    let people = []
    
    for (const i of Array(pagesNum).keys()) {
        await page.goto(`${currentUrl}&page=${i + offset}`, {timeout: 300000});
        // 5D=skill%3AAndroid&f%5B%5D=skill%3AC&f%5B%5D=skill%3AC%23&f%5B%5D=skill%3AC%2B%2B&f%5B%5D=skill%3AGolang&f%5B%5D=skill%3AiOS&f%5B%5D=skill%3AJava&f%5B%5D=skill%3AJavaScript&f%5B%5D=skill%3ANode.js&f%5B%5D=skill%3AQA+Engineering&f%5B%5D=skill%3AReact+Native&f%5B%5D=skill%3AReact.js&f%5B%5D=skill%3ARuby&f%5B%5D=skill%3ARuby+on+Rails&f%5B%5D=skill%3AUnity
        // await newPage.goto(`https://app.turbohiring.co/uk/front?recruiter=0&loc%5B0%5D=102&page=${i + offset}`, {timeout: 300000});
        await page.waitForSelector(selectors.candidate, {timeout: 300000});
        let elNum = (Array.from(await page.$$(selectors.candidate)).length);
        for (const n of Array(elNum).keys()) {

            let candidateData = {}
            let candidateElement = await page.$(`.views-row:nth-child(${n + 1})`);
            candidateData['name'] = await candidateElement.$eval(selectors.name, el => el.textContent.trim());
            // candidateData['experience'] = await candidateElement.$eval(selectors.experience, el => el.textContent.trim().replace(/(\r\n|\n|\r)/gm, "").trim());
            candidateData['experience'] = await candidateElement.$(selectors.experience) ? await candidateElement.$eval(selectors.experience, el => el.textContent.trim().replace(/(\r\n|\n|\r)/gm, "").trim()) : undefined;
            candidateData['skills'] = await candidateElement.$(selectors.skills) ? await candidateElement.$eval(selectors.skills, el => el.textContent.trim().replace(/(\r\n|\n|\r)/gm, "")) : undefined;
            candidateData['email'] = await candidateElement.$(selectors.emailIcon) ? await candidateElement.$eval(selectors.emailIcon, (el, dataAttribute) => el.parentElement.getAttribute(dataAttribute), selectors.dataAttribute) : undefined;
            candidateData['phone'] = await candidateElement.$(selectors.phoneIcon) ? await candidateElement.$eval(selectors.phoneIcon, (el, dataAttribute) => el.parentElement.getAttribute(dataAttribute), selectors.dataAttribute) : undefined;
            candidateData['skype'] = await candidateElement.$(selectors.skypeIcon) ? await candidateElement.$eval(selectors.skypeIcon, (el, dataAttribute) => el.parentElement.getAttribute(dataAttribute), selectors.dataAttribute) : undefined; 
            candidateData['facebook'] = await candidateElement.$(selectors.facebookIcon) ? await candidateElement.$eval(selectors.facebookIcon, el => el.parentElement.getAttribute('title')) : undefined;
            candidateData['telegram'] = await candidateElement.$(selectors.telegramIcon) ? await candidateElement.$eval(selectors.telegramIcon, el => el.parentElement.getAttribute('title')) : undefined;
            candidateData['linkedin'] = await candidateElement.$(selectors.linkedInIcon) ? await candidateElement.$eval(selectors.linkedInIcon, el => {
                let link = el.parentElement.getAttribute('href');
                return `https://${link.slice(link.search(/www/)).replace(/%252F/gi, '/')}`
            }) : undefined;
            
            // new ObjectsToCsv([candidateData]).toDisk('./people.csv', {append: true});
            
            // people.push(candidateData);

        }
        console.log(`Done with https://app.turbohiring.co/uk/front?page=${i + offset}`);
    }
    
    // const csv = new ObjectsToCsv(people);
    // await csv.toDisk('./people.csv');
    // console.log(people);
    await browser.close();
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

run();