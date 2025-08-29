// Car data extraction logic
export async function extractCarDetails(page) {
  return await page.evaluate(() => {
    const getText = (selector) => {
      const element = document.querySelector(selector);
      const text = element?.textContent?.trim() || '';
      if (text) console.log(`Found with selector ${selector}: ${text}`);
      return text;
    };
    
    const getNextSiblingText = (selector) => {
      const element = document.querySelector(selector);
      const text = element?.nextElementSibling?.textContent?.trim() || '';
      if (text) console.log(`Found sibling for ${selector}: ${text}`);
      return text;
    };
    
    // Fallback function for dt/dd pairs
    function getDd(label) {
      const dts = Array.from(document.querySelectorAll('dt'));
      for (const dt of dts) {
        if (dt.textContent.trim().toLowerCase() === label.toLowerCase()) {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === 'dd') {
            const text = dd.textContent.trim();
            if (text) console.log(`Found with getDd(${label}): ${text}`);
            return text;
          }
        }
      }
      return '';
    }

    console.log('=== Starting extraction ===');
    console.log('Available test selectors:', Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid')).slice(0, 10));
    console.log('Available dt elements:', Array.from(document.querySelectorAll('dt')).map(el => el.textContent.trim()).slice(0, 10));

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

    console.log('=== Trying fallbacks ===');
    // Fallback using getDd() pattern for missing data
    if (!result.first_registration) result.first_registration = getDd('First registration') || getDd('Erstzulassung');
    if (!result.mileage) result.mileage = getDd('Mileage') || getDd('Kilometerstand');
    if (!result.power) result.power = getDd('Power') || getDd('Leistung');
    if (!result.transmission) result.transmission = getDd('Transmission') || getDd('Getriebe');
    if (!result.fuel) result.fuel = getDd('Fuel') || getDd('Kraftstoff');
    if (!result.colour) result.colour = getDd('Colour') || getDd('Farbe');
    if (!result.door_count) result.door_count = getDd('Door count') || getDd('Türen');
    if (!result.number_of_seats) result.number_of_seats = getDd('Number of seats') || getDd('Sitze');
    if (!result.cubic_capacity) result.cubic_capacity = getDd('Cubic capacity') || getDd('Hubraum');
    if (!result.weight) result.weight = getDd('Weight') || getDd('Gewicht');
    if (!result.cylinders) result.cylinders = getDd('Cylinders') || getDd('Zylinder');
    if (!result.tank_capacity) result.tank_capacity = getDd('Tank capacity') || getDd('Tankvolumen');
    
    const extractedCount = Object.values(result).filter(v => v && v.trim()).length;
    console.log(`=== Final result: Extracted ${extractedCount}/${Object.keys(result).length} car specifications ===`);
    
    return result;
  });
}