const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Storage = require('node-storage');
const store = new Storage('./store.json');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://kwork.ru/projects?fc=41');
    await page.waitForTimeout(3000);
    const pagesAmount = await page.evaluate(() => 
        parseInt([...[...document.querySelectorAll('ul')].at(-1).querySelectorAll('li')].at(-2).innerText, 10)
    );
    const results = [];
    for (let index = 0; index < pagesAmount; index++) {
        console.log(`${index+1}/${pagesAmount}`);
        results.push(...await processPage(page, index+1));
    }
    console.log(results);
})();

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