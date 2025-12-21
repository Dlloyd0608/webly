#!/usr/bin/env node
// ./buildr/generator.js
// Main build script for WebGen Phase - 1
// Corrected Syntax Error and Asset Copy Logic

const fs = require('fs');
const path = require('path');
const HTMLRenderer = require('./renderer');

class WebGenBuilder {
  constructor() {
    this.config = {
      paths: {
        build: "./_buildr/",
        templates: "./_templates/",
        site: "./site/",
        src: "./src/",
        styles: "./styles/",
        dist: "./_dist/",
        // Ensure assets path is defined for copyAssets to use
        assets: "./assets/" 
      }
    };
    
    this.renderer = new HTMLRenderer(this.config);
    this.dependencyGraph = {};
  }

  /**
   * Main entry point orchestrating optimized SSR
   */
  async build(options = {}) {
    console.log('[WebGen Builder] Starting parallel build execution...');
    const startTime = Date.now();
    
    try {
      await this.renderer.init();
      this.buildDependencyGraph();
      
      if (options.fullRebuild) {
        await this.buildAllPages();
      } else if (options.file) {
        await this.buildAffectedPages(options.file);
      } else {
        console.error('[WebGen Builder] Rebuild mode required: --full-rebuild or --file');
        process.exit(1);
      }
      
      await this.copyAssets();
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[WebGen Builder] Success: Site generated in ${elapsed}s`);
      
    } catch (error) {
      console.error('[WebGen Builder] ✗ Critical Build Failure:', error);
      process.exit(1);
    }
  }

  buildDependencyGraph() {
    console.log('[Builder] mapping content dependencies...');
    const menu = this.renderer.menu;
    
    const processMenuItem = (item) => {
      if (item.id) {
        const pageId = item.id;
        try {
          const source = this.renderer.loadPageConfig(pageId, 'en');
          const contentId = source.contentSource || source.contentSources[0];
          
          if (!this.dependencyGraph[contentId]) this.dependencyGraph[contentId] = [];
          this.dependencyGraph[contentId].push(pageId);
        } catch (e) { /* silent catch for non-existent page configs */ }
      }
      if (item.children) item.children.forEach(processMenuItem);
    };
    
    menu.primaryNavigation.items.forEach(processMenuItem);
    console.log('[Builder] Dependency graph stabilized');
  }

  /**
   * Performance Fix: Renders pages in parallel using Promise.all
   */
  async buildAllPages() {
    const menu = this.renderer.menu;
    const pages = [];
    
    const collectPages = (item) => {
      if (item.id) pages.push(item.id);
      if (item.children) item.children.forEach(collectPages);
    };
    
    menu.primaryNavigation.items.forEach(collectPages);
    menu.footerNavigation.items.forEach(collectPages);
    
    console.log(`[Builder] Queuing ${pages.length} pages for concurrent rendering...`);
    
    const renderQueue = pages.map(async (pageId) => {
      try {
        await this.buildPage(pageId);
      } catch (error) {
        console.error(`[Builder] ✗ Render Error on ${pageId}: ${error.message}`);
      }
    });

    await Promise.all(renderQueue);
  }

  async buildAffectedPages(changedFile) {
    if (changedFile.includes('.content.json')) {
      const contentId = path.basename(changedFile, '.content.json');
      const affected = this.dependencyGraph[contentId] || [];
      await Promise.all(affected.map(pageId => this.buildPage(pageId)));
    } else {
      await this.buildAllPages();
    }
  }

  async buildPage(pageId, language = 'en') {
    try {
      const html = await this.renderer.renderPage(pageId, language);
      let filename = `${pageId}.html`;
      if (pageId === 'home') filename = 'index.html';
      
      const outputPath = path.join(this.config.paths.dist, filename);
      
      this.renderer.writeHTML(outputPath, html);
      console.log(`[Builder] ✓ Generated: ${filename}`);
    } catch (error) {
      console.error(`[Builder] ✗ Error on ${pageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preserves baseline asset synchronization with safety checks
   */
  async copyAssets() {
      console.log('[Builder] Synchronizing static theme assets...');
    
      // Recursive copy function (preserved baseline functionality)
      const copyDir = (src, dest) => {
        if (!fs.existsSync(src)) return;
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) copyDir(srcPath, destPath);
          else fs.copyFileSync(srcPath, destPath);
        }
      };
    
      // 1. Copy styles (main theme files)
      copyDir(this.config.paths.styles, path.join(this.config.paths.dist, 'styles'));
      if (fs.existsSync('_styles.css')) {
        fs.copyFileSync('_styles.css', path.join(this.config.paths.dist, '_styles.css'));
      }

      // 2. CRITICAL FIX: Copy the local image directory (assets)
      if (fs.existsSync(this.config.paths.assets)) {
          copyDir(this.config.paths.assets, path.join(this.config.paths.dist, 'assets'));
      }
    
      console.log('[Builder] Styles and assets synchronized to _dist/');
  }
}

// ------------------------------------------------------------------
// FIX: Wrap the external function definition to resolve SyntaxError
// ------------------------------------------------------------------
(function() {
  function parseArgs() {
    const args = process.argv.slice(2);
    const options = { fullRebuild: false, file: null };
    args.forEach(arg => {
      if (arg === '--full-rebuild') options.fullRebuild = true;
      else if (arg.startsWith('--file=')) options.file = arg.substring(7);
    });
    return options;
  }

  if (require.main === module) {
    const options = parseArgs();
    const builder = new WebGenBuilder();
    builder.build(options);
  }
})();

module.exports = WebGenBuilder;
