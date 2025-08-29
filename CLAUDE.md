# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web scraping project that extracts car listing data from mobile.de (a German used car marketplace) using Playwright automation with Patchright for enhanced bot detection evasion. The project uses modern ES modules and includes both JavaScript and TypeScript implementations.

## Core Architecture

### Dual Implementation Structure

The project contains two main scraper implementations:

1. **JavaScript Implementation** (`mobilede/`):
   - `main.js` - Standalone scraper with modern ES module path handling
   - Self-contained with local input/output directories
   - Uses `import.meta.url` for path resolution

2. **TypeScript Implementation** (`scrapers/mobilede/`):
   - `mobilede2.ts` - TypeScript version with enhanced type safety
   - Organized under structured `scrapers/` directory
   - Shares project-level session and output directories

### Modern ES Module Setup

- **Package Configuration**: `"type": "module"` enables native ES modules
- **Path Handling**: Uses `import.meta.url` with URL constructor instead of `path.resolve()`
- **Import Style**: Modern ES6 import/export syntax throughout
- **TypeScript Support**: Full TypeScript configuration with `@types/node`

### Session Management

Both implementations use persistent browser sessions:
- **Session Storage**: `./session/` (project root) or `./mobilede/session/` (local)
- **Preserves**: Cookies, local storage, authentication state, GDPR consent
- **Benefits**: Eliminates repeated consent modals, maintains consistent fingerprint
- **Anti-Detection**: Persistent context reduces bot detection risk

### Data Architecture

**Standardized 18-field CSV schema:**
- Basic info: `car_name`, `price`, `maker`, `image`, `detail_url`
- Specifications: `first_registration`, `mileage`, `power`, `cubic_capacity`, `fuel`
- Details: `transmission`, `drive_type`, `colour`, `number_of_seats`, `door_count`
- Additional: `weight`, `cylinders`, `tank_capacity`

**Input/Output Structure:**
- Input: JSON files containing car URLs and basic metadata
- Output: Timestamped CSV files with comprehensive car data
- Error handling: Screenshot capture on failures

## Key Technologies

- **Patchright**: Anti-detection browser automation (enhanced Playwright fork)
- **Playwright Core**: Browser automation foundation
- **Modern Node.js**: ES modules, `import.meta.url`, async/await patterns
- **TypeScript**: Type safety and enhanced developer experience
- **CSV Libraries**: `fast-csv`, `csv-parse` for data processing

## Development Commands

```bash
# Install dependencies
npm install

# Run JavaScript implementation
node mobilede/main.js

# Run TypeScript implementation (requires compilation)
node scrapers/mobilede/mobilede2.ts

# Development with TypeScript
npx tsc scrapers/mobilede/mobilede2.ts --outDir dist --target es2022 --module esnext
```

## Anti-Detection Implementation

### Browser Configuration
- Realistic user agent with German locale support
- Proper viewport sizing (1920x1080)
- German timezone (`Europe/Berlin`)
- Comprehensive HTTP headers (`Accept-Language`, etc.)

### Navigation Strategy
- Fallback navigation: `domcontentloaded` → `load` → timeout recovery
- Extended timeouts with intelligent retry logic
- Robust consent modal handling with multiple selector patterns
- Human-like delays and interaction patterns

### Session Persistence
- Maintains consistent browser fingerprint across runs
- Preserves authentication and preference states
- Reduces detection through behavioral consistency

## File Structure

```
mobilede-scraper/
├── mobilede/                    # JavaScript implementation
│   ├── main.js                 # Standalone scraper
│   ├── input/car_urls.json     # Local input data
│   ├── output/                 # Local CSV outputs
│   └── session/                # Local browser session
├── scrapers/mobilede/           # TypeScript implementation  
│   ├── mobilede2.ts            # TypeScript scraper
│   └── car_urls.json           # Input data
├── session/                     # Shared browser session
├── output/                      # Shared CSV outputs
├── tests/                       # Test files
└── package.json                # ES module configuration
```

## Error Handling & Debugging

- **Navigation Failures**: Multi-stage fallback with extended timeouts
- **Screenshot Capture**: Automatic error state documentation
- **Comprehensive Logging**: Detailed console output for debugging
- **Graceful Degradation**: Continues processing on individual failures
- **Session Recovery**: Persistent state reduces startup failures

## Modern JavaScript Features

- **ES Modules**: Native `import`/`export` with `"type": "module"`
- **URL-based Paths**: `new URL('./path', import.meta.url)` instead of `path.resolve()`
- **Async/Await**: Modern asynchronous patterns throughout
- **Template Literals**: Enhanced string formatting and logging
- **Destructuring**: Clean object/array manipulation