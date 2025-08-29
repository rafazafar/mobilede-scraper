import { chromium } from 'patchright';
import fs from 'fs';

// 出力先ディレクトリを作成（存在しない場合は再帰的に作成）
const outputDir = new URL('./output', import.meta.url).pathname;
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// セッション保存ディレクトリを作成
const sessionDir = new URL('./session', import.meta.url).pathname;
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// 収集対象のデータ項目を定義
const HEADERS = [
  'car_name', 'price', 'maker', 'image', 'detail_url',
  'first_registration', 'mileage', 'power', 'cubic_capacity', 'fuel',
  'transmission', 'drive_type', 'colour', 'number_of_seats',
  'door_count', 'weight', 'cylinders', 'tank_capacity'
];

// 車リスト（スクレイピング対象URL群）をJSONから読み込み
const carList = JSON.parse(fs.readFileSync(new URL('./input/car_urls.json', import.meta.url), 'utf8'));

// スリープ関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Cookieバナーや同意ダイアログを処理する
async function handleConsentModal(page) {
  try {
    // 少し待ってからモーダルを探す
    await sleep(2000);

    const selectors = [
      'button[data-testid="uc-accept-all-button"]',
      'button[aria-label="Accept all"]',
      'button:has-text("Alle akzeptieren")',
      'button:has-text("Accept all")',
      'button:has-text("OK")',
      '#mde-consent-modal-dialog button',
      '#gdpr-consent-accept-button',
      '[class*="consent"] button',
      '[class*="cookie"] button'
    ];

    for (const sel of selectors) {
      try {
        const btn = await page.waitForSelector(sel, { timeout: 3000 });
        if (btn && await btn.isVisible()) {
          console.log(`Found consent button with selector: ${sel}`);
          await btn.click();
          await sleep(1500 + Math.random() * 1000);
          return;
        }
      } catch (e) {
        // このセレクタでは見つからなかった、次のセレクタを試す
        continue;
      }
    }
    console.log('No consent modal found');
  } catch (e) {
    console.log('Error in consent modal handling:', e.message);
  }
}

// ページから車両情報を抽出
async function extractCarDetails(page) {
  return await page.evaluate(() => {
    function getDd(label) {
      const dts = Array.from(document.querySelectorAll('dt'));
      for (const dt of dts) {
        if (dt.textContent.trim().toLowerCase() === label.toLowerCase()) {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === 'dd') {
            return dd.textContent.trim();
          }
        }
      }
      return '';
    }

    // 車両仕様情報（<dt>/<dd> の組み合わせ）を取得
    return {
      first_registration: getDd('First registration'),
      mileage: getDd('Mileage'),
      power: getDd('Power'),
      cubic_capacity: getDd('Cubic capacity'),
      fuel: getDd('Fuel'),
      transmission: getDd('Transmission'),
      drive_type: getDd('Drive type'),
      colour: getDd('Colour'),
      number_of_seats: getDd('Number of seats'),
      door_count: getDd('Door count'),
      weight: getDd('Weight'),
      cylinders: getDd('Cylinders'),
      tank_capacity: getDd('Tank capacity')
    };
  });
}

(async () => {
  // Create a new empty output CSV file
  const headerRow = HEADERS.join(',');
  const filename = new URL(`./output/mobilede_output_${Date.now()}.csv`, import.meta.url).pathname;
  fs.writeFileSync(filename, headerRow + '\n');

  // ブラウザ起動（セッション情報を保持）
  const browser = await chromium.launchPersistentContext(sessionDir, {
    channel: "chrome",
    headless: false,
    viewport: null
  });

  // DEBUG: load just 1 car
  for (const car of carList.slice(0, 1)) {
    const detailPage = await browser.newPage();
    try {
      await detailPage.goto(car.detail_url, {waitUntil: 'domcontentloaded' });
      // wait 2-5 seconds
      await sleep(2000 + Math.random() * 3000);

      // GDPRバナー処理（初回アクセス時のみ必要、セッション保存により再利用）
      // await handleConsentModal(detailPage);

      // 車の詳細情報を抽出
      const details = await extractCarDetails(detailPage);
      const results = { ...car, ...details };

      console.log(results)

    } catch (e) {
      console.error(e);
      if (detailPage) {
        // Take screenshot
        const errorFile = join(outputDir, `fatal_error_${car.car_name}_${Date.now()}.png`);
        await detailPage.screenshot({ path: errorFile, fullPage: true });
      }
    }
    finally {
      // await detailPage.close();
    }
  }
  // await browser.close();
}


)();