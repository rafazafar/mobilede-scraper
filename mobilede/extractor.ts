import type { Page } from 'patchright';
import type { CarExtractionResult } from './types.js';

export async function extractCarDetails(page: Page): Promise<CarExtractionResult> {
  return await page.evaluate((): CarExtractionResult => {
    // Check for error messages first
    const errorMessage = document.querySelector('[data-testid="vip-error-message"]');
    if (errorMessage) {
      const errorText = errorMessage.textContent?.trim() || '';
      return {
        error: 'VEHICLE_UNAVAILABLE',
        error_message: errorText,
        status: 'unavailable'
      };
    }
    
    // Check for other common error patterns
    const bodyText = document.body?.textContent || '';
    const errorTexts = [
      'Dieses Fahrzeug ist nicht mehr verfügbar',
      'This Vehicle is not available anymore',
      'nicht verfügbar',
      'not available',
      'sold',
      'verkauft'
    ];
    
    for (const errorText of errorTexts) {
      if (bodyText.includes(errorText)) {
        return {
          error: 'VEHICLE_UNAVAILABLE',
          error_message: errorText,
          status: 'unavailable'
        };
      }
    }
    
    const getText = (selector: string): string => 
      document.querySelector(selector)?.textContent?.trim() || '';
    
    const getNextSiblingText = (selector: string): string => 
      document.querySelector(selector)?.nextElementSibling?.textContent?.trim() || '';
    
    // Fallback function for dt/dd pairs
    function getDd(label: string): string {
      const dts = Array.from(document.querySelectorAll('dt'));
      for (const dt of dts) {
        if (dt.textContent?.trim().toLowerCase() === label.toLowerCase()) {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === 'dd') {
            return dd.textContent?.trim() || '';
          }
        }
      }
      return '';
    }

    const result: Partial<CarExtractionResult> = {
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
      plug_types: Array.from(document.querySelectorAll('[data-testid="vip-battery-information-box"] .z_K9l'))
        .map(el => el.textContent?.trim() || '')
        .join(', '),

      // Features
      features: Array.from(document.querySelectorAll('[data-testid="vip-features-list"] li'))
        .map(li => li.textContent?.trim() || '')
        .join('; '),

      // Description
      description: getText('[data-testid="vip-vehicle-description-text"]'),

      // Dealer Info
      dealer_name: getText('[data-testid="vip-dealer-box-content-section"] .GdlnG'),
      dealer_address: (getText('[data-testid="vip-dealer-box-seller-address1"]') + ' ' + 
                      getText('[data-testid="vip-dealer-box-seller-address2"]')).trim(),
      dealer_rating: getText('[data-testid="rating-score-localized"]'),

      // Price
      price_evaluation: (() => {
        const priceEl = document.querySelector('[data-testid="price-evaluation-click"]');
        return priceEl?.parentElement?.querySelector('._u77E')?.textContent?.trim() || '';
      })(),

      // Images
      images: Array.from(document.querySelectorAll('[data-testid^="slide-container-image"] img'))
        .map(img => (img as HTMLImageElement).srcset || (img as HTMLImageElement).src)
        .join('; ')
    };

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
    
    const extractedCount = Object.values(result).filter(v => v && typeof v === 'string' && v.trim()).length;
    console.log(`Extracted ${extractedCount}/${Object.keys(result).length} car specifications`);
    
    return result as CarExtractionResult;
  });
}