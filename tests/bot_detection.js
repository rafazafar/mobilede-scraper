// patchright here!
import { chromium } from 'patchright'

(async () => {
    const browser = await chromium.launchPersistentContext("...", {
        channel: "chrome",
        headless: true,
        viewport: null,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        // do NOT add custom browser headers
    });
    const page = await browser.newPage();
    await page.goto('https://bot.sannysoft.com/');
    // take a screenshot
    await page.screenshot({ path: './bot_detection.png', fullPage: true });

    await page.goto('https://bot-detector.rebrowser.net/');
    await page.screenshot({ path: './bot_detection2.png', fullPage: true });

    await browser.close();
})();