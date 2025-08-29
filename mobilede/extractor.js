// Car data extraction logic
export async function extractCarDetails(page) {
  return await page.evaluate(() => {
    console.log('=== EXTRACTION DEBUG START ===');
    console.log('Page URL:', window.location.href);
    console.log('Page title:', document.title);
    console.log('Document ready state:', document.readyState);
    console.log('Body innerHTML length:', document.body?.innerHTML?.length || 'NO BODY');
    
    const getText = (selector) => {
      console.log(`🔍 Trying getText("${selector}")`);
      const element = document.querySelector(selector);
      console.log(`   Element found:`, !!element);
      if (element) {
        console.log(`   Element tag:`, element.tagName);
        console.log(`   Element class:`, element.className);
        console.log(`   Element text length:`, element.textContent?.length || 0);
      }
      const text = element?.textContent?.trim() || '';
      if (text) {
        console.log(`✅ getText("${selector}"): "${text}"`);
      } else {
        console.log(`❌ getText("${selector}"): EMPTY`);
      }
      return text;
    };
    
    const getNextSiblingText = (selector) => {
      console.log(`🔍 Trying getNextSiblingText("${selector}")`);
      const element = document.querySelector(selector);
      console.log(`   Element found:`, !!element);
      if (element) {
        console.log(`   Element tag:`, element.tagName);
        console.log(`   Has nextElementSibling:`, !!element.nextElementSibling);
        if (element.nextElementSibling) {
          console.log(`   Sibling tag:`, element.nextElementSibling.tagName);
          console.log(`   Sibling text length:`, element.nextElementSibling.textContent?.length || 0);
        }
      }
      const text = element?.nextElementSibling?.textContent?.trim() || '';
      if (text) {
        console.log(`✅ getNextSiblingText("${selector}"): "${text}"`);
      } else {
        console.log(`❌ getNextSiblingText("${selector}"): EMPTY`);
      }
      return text;
    };
    
    // Fallback function for dt/dd pairs
    function getDd(label) {
      console.log(`🔍 Trying getDd("${label}")`);
      const dts = Array.from(document.querySelectorAll('dt'));
      console.log(`   Found ${dts.length} dt elements total`);
      
      for (const dt of dts) {
        const dtText = dt.textContent.trim().toLowerCase();
        console.log(`   Checking dt: "${dtText}" vs "${label.toLowerCase()}"`);
        if (dtText === label.toLowerCase()) {
          console.log(`   ✅ Match found!`);
          const dd = dt.nextElementSibling;
          console.log(`   Has nextElementSibling:`, !!dd);
          if (dd) {
            console.log(`   Sibling tag:`, dd.tagName.toLowerCase());
          }
          if (dd && dd.tagName.toLowerCase() === 'dd') {
            const text = dd.textContent.trim();
            console.log(`✅ getDd("${label}"): "${text}"`);
            return text;
          }
        }
      }
      console.log(`❌ getDd("${label}"): NOT FOUND`);
      return '';
    }

    console.log('=== PAGE STRUCTURE ANALYSIS ===');
    const allTestIds = Array.from(document.querySelectorAll('[data-testid]'));
    console.log(`Total elements with data-testid: ${allTestIds.length}`);
    console.log('First 20 data-testids:', allTestIds.slice(0, 20).map(el => el.getAttribute('data-testid')));
    
    const allDts = Array.from(document.querySelectorAll('dt'));
    console.log(`Total dt elements: ${allDts.length}`);
    console.log('All dt texts:', allDts.map(el => `"${el.textContent.trim()}"`));
    
    // Check for common container patterns
    console.log('=== CONTAINER ANALYSIS ===');
    console.log('vip-vehicle-details elements:', document.querySelectorAll('[class*="vip-vehicle-details"]').length);
    console.log('vip-key-features elements:', document.querySelectorAll('[class*="vip-key-features"]').length);
    console.log('vehicle-details elements:', document.querySelectorAll('[class*="vehicle-details"]').length);
    console.log('specifications elements:', document.querySelectorAll('[class*="specifications"]').length);

    const result = {
      // Key Features & Technical Data
      first_registration: getNextSiblingText('[data-testid="firstRegistration-item"]'),
      mileage: getNextSiblingText('[data-testid="mileage-item"]'),
      power: getNextSiblingText('[data-testid="power-item"]'),
      transmission: getNextSiblingText('[data-testid="transmission-item"]'),
      hu: getNextSiblingText('[data-testid="hu-item"]'),
      fuel: getNextSiblingText('[data-testid="envkv.engineType-item"]'),
      number_of_seats: getNextSiblingText('[data-testid="numSeats-item"]'),
      door_count: getNextSiblingText('[data-testid="doorCount-item"]'),
      colour: getNextSiblingText('[data-testid="color-item"]'),
      manufacturer_color: getNextSiblingText('[data-testid="manufacturerColorName-item"]'),
      interior: getNextSiblingText('[data-testid="interior-item"]'),
      condition: getNextSiblingText('[data-testid="damageCondition-item"]'),
      category: getNextSiblingText('[data-testid="category-item"]'),
      availability: getNextSiblingText('[data-testid="availability-item"]'),
      origin: getNextSiblingText('[data-testid="countryVersion-item"]'),
      environmental_badge: getNextSiblingText('[data-testid="emissionsSticker-item"]'),
      co2_emissions: getNextSiblingText('[data-testid="envkv.co2Emissions-item"]'),
      air_conditioning: getNextSiblingText('[data-testid="climatisation-item"]'),
      parking_assist: getNextSiblingText('[data-testid="parkAssists-item"]'),
      airbags: getNextSiblingText('[data-testid="airbag-item"]'),
      
      // Battery Info
      battery_capacity: getNextSiblingText('[data-testid="batteryCapacity-item"]'),
      battery_status: getText('[data-testid="vip-key-features-list-item-batteryStatus"] .geJSa'),
      plug_types: Array.from(document.querySelectorAll('[data-testid="vip-battery-information-box"] .z_K9l')).map(el => el.textContent.trim()).join(', '),

      // Features
      features: Array.from(document.querySelectorAll('[data-testid="vip-features-list"] li')).map(li => li.textContent.trim()).join('; '),

      // Description
      description: getText('[data-testid="vip-vehicle-description-text"]'),

      // Dealer Info
      dealer_name: getText('[data-testid="vip-dealer-box-content-section"] .GdlnG'),
      dealer_address: (getText('[data-testid="vip-dealer-box-seller-address1"]') + ' ' + getText('[data-testid="vip-dealer-box-seller-address2"]')).trim(),
      dealer_rating: getText('[data-testid="rating-score-localized"]'),

      // Price
      price_evaluation: (() => {
        const priceEl = document.querySelector('[data-testid="price-evaluation-click"]');
        return priceEl?.parentElement?.querySelector('._u77E')?.textContent?.trim() || '';
      })(),

      // Images
      images: Array.from(document.querySelectorAll('[data-testid^="slide-container-image"] img')).map(img => img.srcset || img.src).join('; ')
    };

    console.log('=== PRIMARY EXTRACTION COMPLETE ===');
    let extractedCount = Object.values(result).filter(v => v && v.trim()).length;
    console.log(`After primary extraction: ${extractedCount}/${Object.keys(result).length} fields filled`);
    
    console.log('=== TRYING FALLBACKS ===');
    // Fallback using getDd() pattern for missing data
    const fallbackFields = [
      { key: 'first_registration', labels: ['First registration', 'Erstzulassung'] },
      { key: 'mileage', labels: ['Mileage', 'Kilometerstand'] },
      { key: 'power', labels: ['Power', 'Leistung'] },
      { key: 'transmission', labels: ['Transmission', 'Getriebe'] },
      { key: 'fuel', labels: ['Fuel', 'Kraftstoff'] },
      { key: 'colour', labels: ['Colour', 'Farbe'] },
      { key: 'door_count', labels: ['Door count', 'Türen'] },
      { key: 'number_of_seats', labels: ['Number of seats', 'Sitze'] },
      { key: 'cubic_capacity', labels: ['Cubic capacity', 'Hubraum'] },
      { key: 'weight', labels: ['Weight', 'Gewicht'] },
      { key: 'cylinders', labels: ['Cylinders', 'Zylinder'] },
      { key: 'tank_capacity', labels: ['Tank capacity', 'Tankvolumen'] }
    ];
    
    fallbackFields.forEach(field => {
      if (!result[field.key]) {
        console.log(`🔄 Trying fallback for ${field.key}...`);
        for (const label of field.labels) {
          const fallbackValue = getDd(label);
          if (fallbackValue) {
            result[field.key] = fallbackValue;
            console.log(`✅ Fallback success for ${field.key}: "${fallbackValue}"`);
            break;
          }
        }
        if (!result[field.key]) {
          console.log(`❌ All fallbacks failed for ${field.key}`);
        }
      }
    });
    
    extractedCount = Object.values(result).filter(v => v && v.trim()).length;
    console.log(`=== FINAL RESULT ===`);
    console.log(`Extracted ${extractedCount}/${Object.keys(result).length} car specifications total`);
    
    // Show what we actually extracted
    const extracted = Object.entries(result).filter(([key, value]) => value && value.trim());
    console.log('Successfully extracted fields:', extracted.map(([key, value]) => `${key}: "${value}"`));
    
    console.log('=== EXTRACTION DEBUG END ===');
    return result;
  });
}