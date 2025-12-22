# WebGen Build System - Complete Setup

All remaining files needed for the build system.

---

## build/watcher.js (Daemon Controller)

```javascript
#!/usr/bin/env node
// build/watcher.js
// File watcher daemon for WebGen Phase 1
// Monitors JSON files and triggers appropriate rebuilds

const chokidar = require('chokidar');
const { exec } = require('child_process');
const browserSync = require('browser-sync').create();

class WebGenWatcher {
  constructor() {
    this.isBuilding = false;
    this.buildQueue = [];
    this.debounceTimer = null;
  }

  /**
   * Start watching
   */
  start() {
    console.log('[CMS Watcher] Starting...');
    
    // Start browser-sync
    browserSync.init({
      server: './dist',
      port: 3000,
      notify: false,
      open: false
    });
    
    console.log('[CMS Watcher] Browser-sync started on http://localhost:3000');
    
    // Watch paths
    const watcher = chokidar.watch([
      'data/**/*.json',
      'framework/**/*.json',
      'styles/**/*.css'
    ], {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    // Handle changes
    watcher.on('change', (filepath) => {
      this.handleChange(filepath);
    });
    
    console.log('[CMS Watcher] Active - monitoring for changes');
    console.log('Watching:');
    console.log('  - data/**/*.json');
    console.log('  - framework/**/*.json');
    console.log('  - styles/**/*.css');
  }

  /**
   * Handle file change
   */
  handleChange(filepath) {
    console.log(`[${this.timestamp()}] Changed: ${filepath}`);
    
    // Add to queue
    this.buildQueue.push(filepath);
    
    // Debounce (wait for more changes)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, 500);
  }

  /**
   * Process queued changes
   */
  async processQueue() {
    if (this.isBuilding) {
      console.log('[CMS Watcher] Build already in progress, queuing...');
      return;
    }
    
    const files = [...this.buildQueue];
    this.buildQueue = [];
    
    if (files.length === 0) return;
    
    this.isBuilding = true;
    
    try {
      // Determine rebuild scope
      const needsFullRebuild = files.some(f => this.isGlobalFile(f));
      
      if (needsFullRebuild) {
        console.log('[CMS Watcher] → Global file detected');
        console.log('[CMS Watcher] → Spawning: npm run cms-regen-site');
        await this.runCommand('npm run cms-regen-site');
      } else {
        // Rebuild affected pages
        for (const file of files) {
          if (this.isContentOrPageFile(file)) {
            console.log('[CMS Watcher] → Spawning: npm run cms-regen-page');
            await this.runCommand(`npm run cms-regen-page -- --file="${file}"`);
          } else if (this.isStyleFile(file)) {
            console.log('[CMS Watcher] → Copying stylesheet');
            await this.copyStyles();
          }
        }
      }
      
      // Refresh browser
      browserSync.reload();
      console.log('[CMS Watcher] Browser refreshed');
      
    } catch (error) {
      console.error('[CMS Watcher] Build error:', error.message);
    } finally {
      this.isBuilding = false;
      console.log('[CMS Watcher] Active - monitoring for changes');
    }
  }

  /**
   * Run shell command
   */
  runCommand(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(stderr);
          reject(error);
          return;
        }
        console.log(stdout);
        resolve();
      });
    });
  }

  /**
   * Copy stylesheets
   */
  async copyStyles() {
    await this.runCommand('npm run copy-styles');
  }

  /**
   * Check if file is global (affects all pages)
   */
  isGlobalFile(filepath) {
    return filepath.includes('framework/_') || 
           filepath.includes('_menu.json');
  }

  /**
   * Check if file is content or page config
   */
  isContentOrPageFile(filepath) {
    return filepath.includes('.content.json') || 
           filepath.includes('.page.json');
  }

  /**
   * Check if file is stylesheet
   */
  isStyleFile(filepath) {
    return filepath.includes('.css');
  }

  /**
   * Get timestamp
   */
  timestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }
}

// Start watcher
if (require.main === module) {
  const watcher = new WebGenWatcher();
  watcher.start();
}

module.exports = WebGenWatcher;
```

---

## package.json

```json
{
  "name": "webgen-phase1",
  "version": "1.0.0",
  "description": "WebGen Phase 1 - Static Site Generator",
  "main": "build/generator.js",
  "scripts": {
    "cms-watcher": "node build/watcher.js",
    "cms-regen-page": "node build/generator.js --incremental",
    "cms-regen-site": "node build/generator.js --full-rebuild",
    "copy-styles": "cp -r styles dist/ && cp _styles.css dist/",
    "dev": "npm run cms-watcher",
    "build": "npm run cms-regen-site",
    "start": "npm run cms-watcher"
  },
  "keywords": ["static-site", "generator", "webgen"],
  "author": "Your Team",
  "license": "MIT",
  "dependencies": {
    "handlebars": "^4.7.8",
    "chokidar": "^3.6.0",
    "browser-sync": "^3.0.2"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "eslint": "^8.50.0"
  }
}
```

---

## .gitignore

```
# Build output
dist/
dist-builds/

# Dependencies
node_modules/

# Temp files
.temp/
*.tmp

# Logs
npm-debug.log*
*.log

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo

# Build locks
.build.lock
```

---

## build/helpers.js (Helper Functions)

```javascript
// build/helpers.js
// Helper functions for the build system

const fs = require('fs');
const path = require('path');

/**
 * Markdown to HTML (simple implementation)
 */
function markdownToHtml(str) {
  if (typeof str !== 'string') return str;
  
  // Bold
  let html = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet lists
  if (html.trim().startsWith('*') || html.trim().startsWith('-')) {
    html = '<ul>' + html.split(/[\r\n]+/).map(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return `<li>${trimmed.substring(2)}</li>`;
      }
      return '';
    }).join('') + '</ul>';
  }
  
  // Blockquotes
  html = html.replace(/&gt; (.*)/g, '<blockquote>$1</blockquote>');
  
  return html;
}

/**
 * Escape HTML entities
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Load JSON file safely
 */
function loadJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filepath}:`, error.message);
    return null;
  }
}

/**
 * Write file atomically
 */
function writeFileAtomic(filepath, content) {
  const dir = path.dirname(filepath);
  const tempPath = path.join(dir, '.temp', path.basename(filepath) + '.tmp');
  
  // Ensure directories exist
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  
  // Write to temp
  fs.writeFileSync(tempPath, content, 'utf8');
  
  // Atomic rename
  fs.renameSync(tempPath, filepath);
}

module.exports = {
  markdownToHtml,
  escapeHtml,
  loadJSON,
  writeFileAtomic
};
```

---

## README.md (Build System Documentation)

```markdown
# WebGen Phase 1 - Build System

Static site generator for the inPowerSuite website.

## Quick Start

```bash
# Install dependencies
npm install

# Start development (watch mode)
npm run dev

# Build entire site
npm run build
```

## NPM Commands

### Primary Commands
- `npm run cms-watcher` - Start file watcher daemon (runs continuously)
- `npm run cms-regen-page` - Rebuild specific page(s) affected by change
- `npm run cms-regen-site` - Rebuild entire site (all 50 pages)

### Convenience Aliases
- `npm run dev` → `cms-watcher` (most common during development)
- `npm run build` → `cms-regen-site` (pre-deployment)
- `npm start` → `cms-watcher` (Node.js standard)

## Development Workflow

### 1. Start Watch Mode (Morning)
```bash
npm run dev
```
Leave this running in a terminal. It will:
- Monitor `data/`, `framework/`, `styles/` for changes
- Automatically rebuild affected pages
- Refresh browser when complete

### 2. Edit Content (All Day)
Edit JSON files in `data/en/`:
- SME edits `mlm.content.json` → Watcher rebuilds `mlm.html` (1-2s)
- Admin edits `_layouts.json` → Watcher rebuilds all pages (15-25s)

Browser refreshes automatically - no manual commands needed!

### 3. Deploy (When Ready)
```bash
npm run build
# Uploads dist/ folder to hosting
```

## Directory Structure

```
webgen-project/
├── build/                  # Build system code
│   ├── watcher.js          # Daemon (cms-watcher)
│   ├── generator.js        # Workers (cms-regen-*)
│   ├── renderer.js         # HTML generator
│   └── helpers.js          # Utility functions
├── templates/              # Handlebars templates
│   ├── page.hbs            # Main page wrapper
│   ├── partials/           # Header, footer, nav
│   └── layouts/            # Section layouts
├── framework/              # Config files (Phase 1 JSON)
├── data/en/                # Content files (Phase 1 JSON)
├── styles/                 # CSS files
├── scripts/                # JavaScript files
├── assets/                 # Images/media
└── dist/                   # Generated HTML (output)
```

## How It Works

### Single Page Update (95% of time)
```
SME edits mlm.content.json
  ↓
Watcher detects change
  ↓
Spawns: npm run cms-regen-page -- --file="mlm.content.json"
  ↓
Worker generates mlm.html
  ↓
Browser auto-refreshes

Time: ~1-2 seconds
```

### Full Site Rebuild (5% of time)
```
Admin edits _layouts.json
  ↓
Watcher detects global change
  ↓
Spawns: npm run cms-regen-site
  ↓
Worker generates all 50 HTML files
  ↓
Browser auto-refreshes

Time: ~15-25 seconds
```

## Testing

```bash
# Test single page build
npm run cms-regen-page -- --file="data/en/hub01/mlm.content.json"

# Test full site build
npm run cms-regen-site

# Check output
open dist/mlm.html
```

## Deployment

```bash
# Build production files
npm run build

# Upload dist/ folder to web server
rsync -avz dist/ user@server:/var/www/html/

# Or deploy to CDN
aws s3 sync dist/ s3://my-bucket/ --delete
```

## Troubleshooting

### Build fails
1. Check JSON syntax: `npm run lint-json`
2. Check file references in page configs
3. Check template syntax

### Page not updating
1. Check if watcher is running
2. Check console for errors
3. Try manual rebuild: `npm run build`

### Browser not refreshing
1. Check browser-sync connection (http://localhost:3000)
2. Restart watcher: `Ctrl+C`, then `npm run dev`
```

---

## Installation Steps

1. Create all directories:
```bash
mkdir -p build templates/partials templates/layouts dist
```

2. Create all files from above

3. Install dependencies:
```bash
npm install
```

4. Run initial build:
```bash
npm run build
```

5. Start development:
```bash
npm run dev
```

Open http://localhost:3000 and start editing JSON files!

