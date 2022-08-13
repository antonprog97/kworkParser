const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Storage = require('node-storage');
const store = new Storage('./store.json');
const { VK } = require('vk-io');
const express = require('express');
const app = express();
require('dotenv').config();
const { HearManager } = require('@vk-io/hear')
const vk = new VK({
    token: process.env.TOKEN
});
const fsExtra = require('fs-extra');
const bot = new HearManager();
vk.updates.on('message_new', bot.middleware);

puppeteer.use(StealthPlugin());
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
async function checkOffers(browser, categoryID, sendToId) {
    // fsExtra.emptyDirSync('./screens');
    // await new Promise(r => setTimeout(r, 3000));

    // const browser = await puppeteer.launch({ 
    //     headless: true,             
    //     args: [
    //         '--disable-site-isolation-trials', 
    //         '--no-sandbox', 
    //         '--disable-setuid-sandbox'
    //     ]
    // });
    
    try {
        const page = await browser.newPage();
        await page.goto(`https://kwork.ru/projects?fc=${categoryID}`);
        await page.waitForTimeout(5000);
        const pagesAmount = await page.evaluate(() => 
            parseInt([...[...document.querySelectorAll('ul')].at(-1).querySelectorAll('li')].at(-2).innerText, 10)
        );
        const results = [];
        console.log(`CategoryID: ${categoryID} SendToID: ${sendToId}`);
        for (let index = 0; index < pagesAmount; index++) {
            console.log(`${index+1}/${pagesAmount}`);
            results.push(...await processPage(page, index+1, categoryID));
        }
        const db = store.get('db');
        for (const link of results) {
            if (!db.includes(link)) { 
                db.push(link);
                console.log(`new offer: ${link}`);
                await page.goto(link);
                const block = await page.$('.card');
                await block.screenshot({ path: `./screens/${link.split('projects/')[1]}.jpg` });

                vk.upload
                .messagePhoto({
                    source: {
                        value: `./screens/${link.split('projects/')[1]}.jpg`
                    }
                })
                .then((attachment) =>
                    vk.api.messages.send({
                        attachment,
                        random_id: +new Date(),
                        peer_id: sendToId,
                        message: `jjlr.ru?link=${link}`,
                        v: '5.131'
                    })
                );
            }
        }
        store.put('db', db);
    } catch (error) {
        console.log('1', error);
        await page.screenshot({ fullPage: true, path: './1.jpg' });
    }
    // await browser.close();
}
async function processPage(page, pageNumber, categoryID) {
    try {
        await page.goto(`https://kwork.ru/projects?view=0&page=${pageNumber}&fc=${categoryID}`);
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
        // for (let index = 0; index < offers.length; index++) {   
        //     const offer = offers[index];
        //     const el = await page.$(`[href="${offer}"]`);
        //     const block = await (async () => {
        //         let result = el;
        //         for (let index = 0; index < 5; index++) {
        //             result = (await result.$x('..'))[0];
        //         }
        //         (await result.$('.link_local')).click();
        //         await page.waitForTimeout(500);
        //         return result;
        //     })();
        //     await block.screenshot({ path: `./screens/${offer.split('projects/')[1]}.jpg` });
        // }
        return offers;
    } catch (error) {
        console.log('2', error);
        await page.screenshot({ fullPage: true, path: './2.jpg' });
        return [];
    }
}

(async () => {
    while (true) {
        fsExtra.emptyDirSync('./screens');
        await new Promise(r => setTimeout(r, 3000));

        const browser = await puppeteer.launch({ 
            headless: true,          
            args: [
                '--disable-site-isolation-trials', 
                '--no-sandbox', 
                '--disable-setuid-sandbox'  
            ]
        });
        await checkOffers(browser, 41, 2000000001);
        await checkOffers(browser, 80, 2000000001);
        await checkOffers(browser, 79, 433238820);
        await checkOffers(browser, 37, 433238820);
        await checkOffers(browser, 38, 433238820);
        await browser.close();
        await new Promise(r => setTimeout(r, 10*60*1000));
    }
})();

vk.updates.start().catch(console.error);
app.listen(3799);