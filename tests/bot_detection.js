// patchright here!
import { chromium } from 'patchright'

(async () => {

    const botScannerUrls = [{
        name: 'sannysoft',
        url: 'https://bot.sannysoft.com/'},
        {name: 'rebrowser', url: 'https://bot-detector.rebrowser.net/'},
        {name: 'kaliiiiiiiiii', url: 'https://kaliiiiiiiiii.github.io/brotector/'},
        {name: 'creepjs', url: 'https://abrahamjuliot.github.io/creepjs/'},
        {name: 'fingerprint', url: 'https://fingerprint.com/products/bot-detection/'},
        {name: 'iphey', url: 'https://iphey.com/'},
        {name: 'pixelscan', url: 'https://pixelscan.net/fingerprint-check'},
        {name: 'browserscan', url: 'https://browserscan.net/'}
    ];

    const browser = await chromium.launchPersistentContext("...", {
        channel: "chrome",
        headless: true,
        viewport: null,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        // do NOT add custom browser headers
    });

    // wait for all to finish
    await Promise.all(botScannerUrls.map(async (url) => {
        const page = await browser.newPage();
        await page.goto(url.url);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: `./tests/result/${url.name}.png`, fullPage: true });
        await page.close();
    }));

    await browser.close();    
    process.exit(0);
})();