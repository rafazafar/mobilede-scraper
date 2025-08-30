import { chromium } from 'patchright';
import fs from 'fs';
import { join } from 'path';
import pLimit from 'p-limit';

import { extractCarDetails } from './extractor.js';
import type { CarData, ProcessingConfig, CarProcessFunction } from './types.js';

// Create output directory (recursively if it doesn't exist)
const outputDir = new URL('./output', import.meta.url).pathname;
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Define data fields to collect
const HEADERS: (keyof CarData)[] = [
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

// Load car list (scraping target URLs) from JSON
const carList: CarData[] = JSON.parse(
  fs.readFileSync(new URL('./input/car_urls.json', import.meta.url), 'utf8')
);

// Processing configuration
const PROCESSING_CONFIG: ProcessingConfig = {
  concurrent: true, // Set to false for sequential processing
  maxConcurrentPages: 10 // Limit concurrent pages to avoid overwhelming the server
};

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle Cookie banners and consent dialogs
async function handleConsentModal(page: import('patchright').Page): Promise<void> {
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

    // Try all selectors at once with shorter timeout
    const selectorString = selectors.join(', ');
    const btn = await page.locator(selectorString).first()
      .waitFor({ state: 'visible', timeout: 2000 })
      .catch(() => null);

    if (btn) {
      console.log('Found consent button, clicking...');
      await page.locator(selectorString).first().click();
      await sleep(500);
    } else {
      console.log('No consent modal found');
    }
  } catch (e) {
    console.log('Error in consent modal handling:', (e as Error).message);
  }
}

// Process a single car
const processCar: CarProcessFunction = async (browser, car, filename) => {
  const detailPage = await browser.newPage();
  try {
    console.log(`\n🚗 Processing: ${car.car_name} : ${car.detail_url}`);

    // Remove existing lang parameter from URL
    car.detail_url = car.detail_url.replace(/&lang=[a-zA-Z-]+/, '');

    await detailPage.goto(car.detail_url + '&lang=en', { waitUntil: 'domcontentloaded' });

    // Wait 2-4 seconds
    await sleep(2000 + Math.random() * 2000);

    // Handle GDPR banner (only needed on first access, reused via session saving)
    await handleConsentModal(detailPage);

    // Extract car details
    console.log('🔍 Starting data extraction...');
    const details = await extractCarDetails(detailPage);
    if (details.error === 'VEHICLE_UNAVAILABLE') {
      console.log('🚨 Vehicle is no longer available, skipping...');
      return;
    }
    
    const results = { ...car, ...details };
    
    // Append to CSV file - convert single object to row string
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
};

(async (): Promise<void> => {
  // Clear session
  fs.rmSync('...', { recursive: true, force: true });

  // Create new empty output CSV file
  const headerRow = HEADERS.join(',');
  const filename = new URL(`./output/mobilede_output_${Date.now()}.csv`, import.meta.url).pathname;
  fs.writeFileSync(filename, headerRow + '\n');

  // Launch browser (maintaining session information)
  const browser = await chromium.launchPersistentContext('...', {
    channel: "chrome",
    headless: true,
    viewport: null
    // DO NOT ADD CUSTOM BROWSER HEADERS!
  });

  console.log(`\n🔧 Processing mode: ${PROCESSING_CONFIG.concurrent ? 'CONCURRENT' : 'SEQUENTIAL'}`);
  if (PROCESSING_CONFIG.concurrent) {
    console.log(`📊 Max concurrent pages: ${PROCESSING_CONFIG.maxConcurrentPages}`);
  }

  if (PROCESSING_CONFIG.concurrent) {
    // Concurrent processing with p-limit
    const limit = pLimit(PROCESSING_CONFIG.maxConcurrentPages);
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
})();