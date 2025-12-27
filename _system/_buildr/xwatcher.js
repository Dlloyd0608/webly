#!/usr/bin/env node
// ./_system/_buildr/watcher.js
// File watcher daemon for WebGen Phase 1
// Monitors JSON files and triggers appropriate rebuilds

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const browserSync = require('browser-sync').create();

class WebGenWatcher {
  constructor() {
    // Load build config
    this.buildConfig = this.loadBuildConfig();
    
    this.isBuilding = false;
    this.buildQueue = [];
    this.debounceTimer = null;
  }

  /**
   * Load build configuration
   */
  loadBuildConfig() {
    const configPath = path.join(__dirname, 'build_config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('[Watcher] ERROR: Build config not found at:', configPath);
      process.exit(1);
    }
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      console.log('[Watcher] ✓ Loaded build config');
      return config;
    } catch (error) {
      console.error('[Watcher] ERROR: Failed to parse build config:', error.message);
      process.exit(1);
    }
  }

  /**
   * Start watching
   */
  start() {
    console.log('\n[CMS Watcher] Starting...\n');
    
    // Start browser-sync
    const serverConfig = this.buildConfig.server || {};
    browserSync.init({
      server: this.buildConfig.paths.dist,
      port: serverConfig.port || 3000,
      notify: serverConfig.notify !== undefined ? serverConfig.notify : false,
      open: serverConfig.open !== undefined ? serverConfig.open : false
    });
    
    console.log(`[CMS Watcher] ✓ Browser-sync started on http://localhost:${serverConfig.port || 3000}\n`);
    
    // Build watch patterns from config
    const watchPatterns = [];
    
    if (this.buildConfig.watch) {
      if (this.buildConfig.watch.contentFiles) {
        watchPatterns.push(this.buildConfig.watch.contentFiles);
      }
      if (this.buildConfig.watch.siteFiles) {
        watchPatterns.push(this.buildConfig.watch.siteFiles);
      }
      if (this.buildConfig.watch.styles) {
        watchPatterns.push(this.buildConfig.watch.styles);
      }
    } else {
      // Fallback to hardcoded patterns
      console.warn('[Watcher] No watch patterns in config, using defaults');
      watchPatterns.push(
        path.join(this.buildConfig.paths.src, '**/*.json'),
        path.join(this.buildConfig.paths.site, '**/*.json'),
        path.join(this.buildConfig.paths.styles, '**/*.css')
      );
    }
    
    // Watch paths
    const watcher = chokidar.watch(watchPatterns, {
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
    
    console.log('[CMS Watcher] Active - monitoring for changes\n');
    console.log('Watching patterns:');
    watchPatterns.forEach(pattern => {
      console.log(`  - ${pattern}`);
    });
    console.log('');
  }

  /**
   * Handle file change
   */
  handleChange(filepath) {
    console.log(`\n[${this.timestamp()}] File changed: ${filepath}`);
    
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
        console.log('[CMS Watcher] → Spawning: npm run cms-regen-site\n');
        await this.runCommand('npm run cms-regen-site');
      } else {
        // Rebuild affected pages
        for (const file of files) {
          if (this.isContentOrPageFile(file)) {
            console.log('[CMS Watcher] → Spawning: npm run cms-regen-page\n');
            await this.runCommand(`npm run cms-regen-page -- --file="${file}"`);
          } else if (this.isStyleFile(file)) {
            console.log('[CMS Watcher] → Copying stylesheet\n');
            await this.copyStyles();
          }
        }
      }
      
      // Refresh browser
      browserSync.reload();
      console.log('[CMS Watcher] ✓ Browser refreshed\n');
      
    } catch (error) {
      console.error('[CMS Watcher] ✗ Build error:', error.message);
    } finally {
      this.isBuilding = false;
      console.log('[CMS Watcher] Active - monitoring for changes\n');
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
    const copyDir = (src, dest) => {
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dest, { recursive: true });
      
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    // Copy styles directory
    copyDir(
      this.buildConfig.paths.styles,
      path.join(this.buildConfig.paths.dist, 'styles')
    );
    
    // Copy root CSS if exists
    if (fs.existsSync('_styles.css')) {
      fs.copyFileSync(
        '_styles.css',
        path.join(this.buildConfig.paths.dist, '_styles.css')
      );
    }
  }

  /**
   * Check if file is global (affects all pages)
   */
  isGlobalFile(filepath) {
    const normalizedPath = filepath.replace(/\\/g, '/');
    const sitePath = this.buildConfig.paths.site.replace(/\\/g, '/');
    
    return normalizedPath.includes(sitePath) && 
           (normalizedPath.includes('_menu.json') || 
            normalizedPath.includes('_layouts.json') ||
            normalizedPath.includes('_page-templates.json') ||
            normalizedPath.includes('_header-layouts.json') ||
            normalizedPath.includes('_navigation-layouts.json') ||
            normalizedPath.includes('site_config.json'));
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
