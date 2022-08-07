const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto('https://kwork.ru/projects?fc=41');
    await page.waitForTimeout(3000);
    const pagesAmount = await page.evaluate(() => 
        parseInt([...[...document.querySelectorAll('ul')].at(-1).querySelectorAll('li')].at(-2).innerText, 10)
    );
    const results = [];
    for (let index = 0; index < pagesAmount; index++) {
        results.push(...(await processPage(page)));
    }
})();

async function processPage(page) {
    try {
        
    } catch (error) {
        console.log(error);
        return [];
    }
}