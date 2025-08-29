# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web scraping project that extracts car listing data from mobile.de (a German used car marketplace) using Playwright automation with Patchright for enhanced bot detection evasion.

## Core Architecture

### Main Components

1. **Web Scraper** - `mobilede2.js`:
   - Uses Patchright (Playwright with anti-detection patches)
   - Extracts detailed car specifications from individual listing pages
   - Implements consent modal handling and error recovery
   - Outputs timestamped CSV files with comprehensive car data

2. **Configuration Files**:
   - `car_urls.json` - Target car URLs with basic metadata (car_name, maker, price, image, detail_url)
   - `socks4_socks5_proxies.txt` - JSON-formatted proxy data with health metrics
   - `package.json` - Dependencies including patchright, playwright-core, csv processing libraries

3. **Output Structure**:
   - All scraped data saves to `./output/` directory (auto-created)
   - CSV format with standardized 18-field schema
   - Timestamped filenames: `mobilede_output_[timestamp].csv`

### Data Schema

The scraper extracts these standardized fields from each car listing:
- Basic info: `car_name`, `price`, `maker`, `image`, `detail_url`
- Specifications: `first_registration`, `mileage`, `power`, `cubic_capacity`, `fuel`
- Details: `transmission`, `drive_type`, `colour`, `number_of_seats`, `door_count`
- Additional: `weight`, `cylinders`, `tank_capacity`

### Key Technologies

- **Patchright** - Anti-detection browser automation (enhanced Playwright)
- **rebrowser-patches** - Additional bot detection evasion
- **fast-csv & csv-parse** - CSV data processing
- **https-proxy-agent** - Proxy support infrastructure

## Development Commands

```bash
# Install dependencies
npm install

# Run the main scraper
node mobilede2.js
```

## Technical Implementation

### Anti-Detection Strategy
- Uses Patchright instead of standard Playwright for enhanced stealth
- Persistent browser context with Chrome channel and session storage
- Session persistence maintains cookies and login state between runs
- Random delays (1-5 seconds) between requests
- Consent modal detection with multiple selector fallbacks
- Error handling with screenshot capture for debugging

### Data Extraction Process
1. Loads target URLs from `car_urls.json`
2. Launches persistent Chrome browser context with session directory (`./session/`)
3. For each car URL:
   - Navigates to detail page with `networkidle` wait
   - Handles consent modals (cookies stored in session for future runs)
   - Extracts specifications using DOM traversal (`<dt>`/`<dd>` pairs)
   - Appends data to timestamped CSV file
   - Implements random delay before next request
4. Captures error screenshots on failures

### Session Management
- Browser session data stored in `./session/` directory
- Preserves cookies, local storage, and authentication state
- Eliminates need to handle consent modals on subsequent runs
- Maintains consistent browser fingerprint across sessions

### Proxy Configuration
- Proxy data stored in JSON format in `socks4_socks5_proxies.txt`
- Includes health metrics (alive status, timeout, uptime percentages)
- Currently configured for Japanese SOCKS4 proxies
- Integration ready but not actively used in current scraper version

## File Structure

- `mobilede2.js` - Main scraper implementation
- `car_urls.json` - Input URLs and metadata (25 sample cars)
- `socks4_socks5_proxies.txt` - Proxy configuration data
- `session/` - Browser session data (cookies, local storage, login state)
- `output/` - Generated CSV files and error screenshots
- `package.json` - Node.js dependencies and configuration

## Error Handling

- Comprehensive try-catch blocks around page operations
- Screenshots captured on fatal errors: `fatal_error_[car_name]_[timestamp].png`
- Continues processing remaining cars even if individual requests fail
- Network timeout handling with `networkidle` wait strategy