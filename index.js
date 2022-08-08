const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Storage = require('node-storage');
const store = new Storage('./store.json');
const { VK } = require('vk-io');
require('dotenv').config();
const { HearManager } = require('@vk-io/hear')
const vk = new VK({
    token: process.env.TOKEN
})
const bot = new HearManager();
vk.updates.on('message_new', bot.middleware);

puppeteer.use(StealthPlugin());

async function checkOffers() {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto('https://kwork.ru/projects?fc=41');
        await page.waitForTimeout(5000);
        const pagesAmount = await page.evaluate(() => 
            parseInt([...[...document.querySelectorAll('ul')].at(-1).querySelectorAll('li')].at(-2).innerText, 10)
        );
        const results = [];
        for (let index = 0; index < pagesAmount; index++) {
            console.log(`${index+1}/${pagesAmount}`);
            results.push(...await processPage(page, index+1));
        }
        const db = store.get('db');
        for (const link of results) {
            if (!db.includes(link)) { 
                db.push(link);
                console.log(`new offer: ${link}`);
                vk.api.messages.send({
                    random_id: +new Date(),
                    peer_id: 2000000001,
                    message: `${link}`,
                    v: '5.131'
                });
            }
        }
        store.put('db', db);
    } catch (error) {
        console.log(error);
    }
    await browser.close();
}
async function processPage(page, pageNumber) {
    try {
        await page.goto(`https://kwork.ru/projects?view=0&page=${pageNumber}&fc=41`);
        const offers = await page.evaluate(() => {
            const pageResults = [];
            for (const iterator of document.querySelector('.wants-content').children[0].children) {
                try {
                    const offerLink = iterator.querySelector('a')?.href;
                    if (!offerLink || !offerLink.includes('projects/')) continue;
                    pageResults.push(offerLink);
                } catch (error) {
                    console.log(error);
                    continue;
                }
            }
            return pageResults;
        });
        return offers;
    } catch (error) {
        console.log(error);
        return [];
    }
}

(async () => {
    while (true) {
        await checkOffers();
        await new Promise(r => setTimeout(r, 5*60*1000))
    }
})();

vk.updates.start().catch(console.error);