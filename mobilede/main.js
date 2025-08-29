import { chromium } from 'patchright';
import fs from 'fs';
import { join } from 'path';
import pLimit from 'p-limit';

import { extractCarDetails } from './extractor.js';

// 出力先ディレクトリを作成（存在しない場合は再帰的に作成）
const outputDir = new URL('./output', import.meta.url).pathname;
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// // セッション保存ディレクトリを作成
// const sessionDir = new URL('./session', import.meta.url).pathname;
// if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// 収集対象のデータ項目を定義
const HEADERS = [
  'car_name', 'price', 'maker', 'image', 'detail_url',
  'first_registration', 'mileage', 'power', 'cubic_capacity', 'fuel',
  'transmission', 'drive_type', 'colour', 'number_of_seats',
  'door_count', 'weight', 'cylinders', 'tank_capacity',
  'condition', 'category', 'availability', 'origin', 'battery_capacity',
  'battery_status', 'plug_types', 'co2_emissions', 'environmental_badge',
  'hu', 'air_conditioning', 'parking_assist', 'airbags',
  'manufacturer_color', 'interior', 'features', 'description',
  'dealer_name', 'dealer_address', 'dealer_rating', 'price_evaluation', 'images'
];

// 車リスト（スクレイピング対象URL群）をJSONから読み込み
const carList = JSON.parse(fs.readFileSync(new URL('./input/car_urls.json', import.meta.url), 'utf8'));

// Processing configuration
const CONCURRENT_PROCESSING = true; // Set to false for sequential processing
const MAX_CONCURRENT_PAGES = 10; // Limit concurrent pages to avoid overwhelming the server

// スリープ関数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Cookieバナーや同意ダイアログを処理する
async function handleConsentModal(page) {
  try {
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

    // より短いタイムアウトで全てのセレクタを一度に試す
    const selectorString = selectors.join(', ');
    const btn = await page.locator(selectorString).first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => null);

    if (btn) {
      console.log('Found consent button, clicking...');
      await page.locator(selectorString).first().click();
      await sleep(500);
    } else {
      console.log('No consent modal found');
    }
  } catch (e) {
    console.log('Error in consent modal handling:', e.message);
  }
}


// Process a single car
async function processCar(browser, car, filename) {
  const detailPage = await browser.newPage();
  try {
    console.log(`\n🚗 Processing: ${car.car_name} : ${car.detail_url}`);

    // URLから既存のlangパラメータを削除する
    car.detail_url = car.detail_url.replace(/&lang=[a-zA-Z-]+/, '');

    await detailPage.goto(car.detail_url + '&lang=en', { waitUntil: 'domcontentloaded' });

    // wait 2-4 seconds
    await sleep(2000 + Math.random() * 2000);

    // GDPRバナー処理（初回アクセス時のみ必要、セッション保存により再利用）
    await handleConsentModal(detailPage);

    // 車の詳細情報を抽出
    console.log('🔍 Starting data extraction...');
    const details = await extractCarDetails(detailPage);
    if (details.error === 'VEHICLE_UNAVAILABLE') {
      console.log('🚨 Vehicle is no longer available, skipping...');
      return;
    }
    
    const results = { ...car, ...details };
    
    // CSVファイルへの追加 - 単一オブジェクトを行文字列に変換
    const values = HEADERS.map(header => {
      const value = results[header] || '';
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    const resultString = values.join(',');
    fs.appendFileSync(filename, resultString + '\n');

    console.log('✅ Data extraction complete');
  } catch (e) {
    console.error(e);
    if (detailPage) {
      // Take screenshot
      const errorFile = join(outputDir, `fatal_error_${car.car_name}_${Date.now()}.png`);
      await detailPage.screenshot({ path: errorFile, fullPage: true });
    }
  } finally {
    await detailPage.close();
  }
}

(async () => {
  // Clear session
  fs.rmSync('...', { recursive: true, force: true });

  // 新しい空の出力CSVファイルを作成する
  const headerRow = HEADERS.join(',');
  const filename = new URL(`./output/mobilede_output_${Date.now()}.csv`, import.meta.url).pathname;
  fs.writeFileSync(filename, headerRow + '\n');

  // ブラウザ起動（セッション情報を保持）
  const browser = await chromium.launchPersistentContext('...', {
    channel: "chrome",
    headless: true,
    viewport: null
    // DO NOT ADD CUSTOM BROWSER HEADERS!
  });

  console.log(`\n🔧 Processing mode: ${CONCURRENT_PROCESSING ? 'CONCURRENT' : 'SEQUENTIAL'}`);
  if (CONCURRENT_PROCESSING) {
    console.log(`📊 Max concurrent pages: ${MAX_CONCURRENT_PAGES}`);
  }

  if (CONCURRENT_PROCESSING) {
    // Concurrent processing with p-limit
    const limit = pLimit(MAX_CONCURRENT_PAGES);
    const promises = carList.map(car => 
      limit(() => processCar(browser, car, filename))
    );
    await Promise.all(promises);
  } else {
    // Sequential processing (original behavior)
    for (const car of carList) {
      await processCar(browser, car, filename);
    }
  }

  await browser.close();
}

)();