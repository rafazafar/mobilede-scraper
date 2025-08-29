import { chromium } from 'patchright';
import fs from 'fs';
import path from 'path';

// 出力先ディレクトリを作成（存在しない場合は再帰的に作成）
const outputDir = path.resolve('./output');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// セッション保存ディレクトリを作成
const sessionDir = path.resolve('./session');
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// 収集対象のデータ項目を定義
const HEADERS = [
  'car_name', 'price', 'maker', 'image', 'detail_url',
  'first_registration', 'mileage', 'power', 'cubic_capacity', 'fuel',
  'transmission', 'drive_type', 'colour', 'number_of_seats',
  'door_count', 'weight', 'cylinders', 'tank_capacity'
];

// 車リスト（スクレイピング対象URL群）をJSONから読み込み
const carList = JSON.parse(fs.readFileSync('./car_urls.json', 'utf8'));

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
  const results = [];
  const headerRow = HEADERS.join(',');
  const filename = path.join(outputDir, `mobilede_output_${Date.now()}.csv`);
  fs.writeFileSync(filename, headerRow + '\n');

  // ブラウザ起動（セッション情報を保持）
  const browser = await chromium.launchPersistentContext(sessionDir, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US,en;q=0.9',
    timezoneId: 'Europe/Berlin',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9,de;q=0.8'
    }
  });
  
  // DEBUG: load just 1 car
  for (const car of carList.slice(0, 1)) {
    const detailPage = await browser.newPage();
    try {

      // より柔軟なナビゲーション戦略を実装
      console.log(`Navigating to: ${car.car_name} - ${car.detail_url}`);
      
      try {
        await detailPage.goto(car.detail_url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // ページが完全に読み込まれるまで追加の待機
        await detailPage.waitForLoadState('networkidle', { timeout: 30000 });
      } catch (navError) {
        console.warn(`Navigation timeout for ${car.car_name}, trying with basic load state...`);
        await detailPage.goto(car.detail_url, { waitUntil: 'load', timeout: 45000 });
        await detailPage.waitForTimeout(5000); // 追加の待機時間
      }

      // GDPRバナー処理（初回アクセス時のみ必要、セッション保存により再利用）
      await handleConsentModal(detailPage);
      
      // ページが完全に表示されるまで少し待機
      await detailPage.waitForTimeout(2000);


      // 車の詳細情報を抽出
      const details = await extractCarDetails(detailPage);
      results.push({ ...car, ...details });

      console.log(car)

    } catch (e) {
      console.error(e);
      if (detailPage) {
        // Take screenshot
        const errorFile = path.join(outputDir, `fatal_error_${car.car_name}_${Date.now()}.png`);
        await detailPage.screenshot({ path: errorFile, fullPage: true });
      }
    }
    finally {
      // sleep random 1-5 seconds
      await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 4000));
    }
  }
  await browser.close();
}


)();