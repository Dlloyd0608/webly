/**
 * file: ./_system/_buildr/renderer.js
 * Multi-Project Core Rendering Engine
 * 
 * REFACTORED for Multi-Project Support (75% keep / 25% enhance)
 * 
 * ENHANCEMENTS:
 * - Constructor now accepts separate paths and projectConfig parameters
 * - Added resolveAssetPath() for project > shared asset priority
 * - Added getRelativeAssetPath() for HTML output paths
 * - Template loading uses pre-resolved paths.templates
 * - Handlebars helper registration adapted to new structure
 * 
 * PRESERVED (75%):
 * - All core rendering logic unchanged
 * - Performance optimizations (direct routing, pre-compiled caching)
 * - All 14 element type processors
 * - Page composition logic
 * - Citation cleanup utility
 * - Logo fix and centering fix
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const helpers = require('./helpers');
const { registerHandlebarsHelpers } = require('./handlebars_helpers');

// Define global compilation options to ensure cleanliness and functionality
const COMPILATION_OPTIONS = { noComments: true };

class HTMLRenderer {
  /**
   * ENHANCED: Constructor now accepts separate paths and projectConfig
   * Generator.js will pass pre-resolved paths object and project configuration
   */
  constructor(paths, projectConfig) {
    // Store multi-project configuration
    this.paths = paths;
    this.projectConfig = projectConfig;
    
    // Site configuration (loaded during init)
    this.siteConfig = null;
    this.layouts = null;
    this.pageTemplates = null;
    this.headerLayouts = null;
    this.navigationLayouts = null;
    this.menu = null;
    
    // Performance Cache: Layout templates are compiled once during init
    this.templates = {};
    this.partials = {};
    this.combinedBlocks = {}; 
    
    // Media paths (set during init from site_config)
    this.mediaBasePath = null;
    this.mediaFallbackPath = null;
    
    // Language support
    this.language = projectConfig.languages?.default || 'en';
  }

  /**
   * ENHANCED: Uses dynamic paths for site configs
   * Initializes SSR Environment. Registers helpers once globally.
   */
  async init() {
    console.log(`[Renderer:${this.projectConfig.projectName}] Initializing SSR Environment (Optimized)...`);
    await this.loadSiteConfigs();
    await this.loadTemplates(); // Compiles all layouts into cache
    
    // ENHANCED: Pass paths and projectConfig to helpers
    registerHandlebarsHelpers(this.paths, this.projectConfig, this.mediaBasePath, this.mediaFallbackPath);
  }

  /**
   * ENHANCED: Loads site configs from dynamic paths.site
   * PRESERVED: All config loading logic unchanged
   */
  async loadSiteConfigs() {
    const sitePath = this.paths.site;
    
    this.siteConfig = helpers.loadJSON(path.join(sitePath, 'site_config.json'));
    this.layouts = helpers.loadJSON(path.join(sitePath, '_layouts.json'));
    this.pageTemplates = helpers.loadJSON(path.join(sitePath, '_page-templates.json'));
    this.headerLayouts = helpers.loadJSON(path.join(sitePath, '_header-layouts.json'));
    this.navigationLayouts = helpers.loadJSON(path.join(sitePath, '_navigation-layouts.json'));
    this.menu = helpers.loadJSON(path.join(sitePath, '_menu.json'));
    
    // Use logoPath from config (e.g., /assets/) for path construction
    this.mediaBasePath = this.siteConfig.branding.logoPath;
    this.mediaFallbackPath = '/assets/';
    
    // --- FIX: Logo Registration using metadata as source of truth ---
    if (this.siteConfig.branding && this.siteConfig.branding.logos) {
        const logoMeta = this.siteConfig.branding.logos;
        this.siteConfig.branding.logo = {};
        
        // Constructs the final logo URL (e.g., /assets/ + website/ips_logo_white.png)
        Object.keys(logoMeta).forEach(key => {
            this.siteConfig.branding.logo[key] = this.mediaBasePath + logoMeta[key];
        });
    }
    // --- END FIX ---
  }

  /**
   * ENHANCED: Uses pre-resolved paths.templates (already versioned by generator)
   * PRESERVED: Template compilation logic unchanged
   * 
   * Performance B: Compiles and caches all required partials and templates.
   * FIX: Applies { noComments: true } to ensure clean HTML and fix centering bug.
   */
  async loadTemplates() {
    // ENHANCED: Use pre-resolved template path (generator handles versioning)
    const templatesPath = this.paths.templates;
    
    // Validate template directory exists
    if (!fs.existsSync(templatesPath)) {
      throw new Error(
        `Template version not found: ${this.projectConfig.template.version}\n` +
        `Expected at: ${templatesPath}`
      );
    }

    // Compile global site partials (Patterns 1-4)
    const partialFiles = ['announcement_banner.hbs', 'header.hbs', 'navigation.hbs', 'footer.hbs'];
    partialFiles.forEach(file => {
      const p = path.join(templatesPath, file);
      if (fs.existsSync(p)) {
        const name = file.replace('.hbs', '').replace(/_/g, '-');
        // Register partials with comment stripping
        Handlebars.registerPartial(name, fs.readFileSync(p, 'utf8'), COMPILATION_OPTIONS);
      }
    });

    // Compile layout templates into the instance dictionary (Patterns 5-14)
    const layoutFiles = [
      'split_layout.hbs', 'grid_layout.hbs', 'multi_title_lists.hbs', 
      'stacked_image_top.hbs', 'stacked_image_bottom.hbs', 
      'two_column_subtitles.hbs', 'form_1_up.hbs', 'form_2_up_.hbs', 'text_block.hbs'
    ];
    layoutFiles.forEach(file => {
      const p = path.join(templatesPath, file);
      if (fs.existsSync(p)) {
        const name = file.replace('.hbs', '').replace(/_/g, '-');
        const content = fs.readFileSync(p, 'utf8');
        // Compile layouts with comment stripping
        this.templates[name] = Handlebars.compile(content, COMPILATION_OPTIONS);
      }
    });

    // Compile master page template (page_master.hbs)
    const masterPath = path.join(templatesPath, 'page_master.hbs');
    if (!fs.existsSync(masterPath)) {
      throw new Error(`Required template not found: page_master.hbs at ${masterPath}`);
    }
    const masterContent = fs.readFileSync(masterPath, 'utf8');
    this.templates['page'] = Handlebars.compile(masterContent, COMPILATION_OPTIONS);
    
    console.log(`[Renderer:${this.projectConfig.projectName}] Loaded templates from ${templatesPath}`);
  }

  /**
   * ENHANCED: Asset resolution with project > shared priority
   * 
   * Resolves asset path with priority: project assets > shared assets
   * Returns absolute file system path or null if not found
   * 
   * @param {string} filename - Asset filename (e.g., 'images/logo.png')
   * @returns {string|null} - Absolute path to asset or null
   */
  resolveAssetPath(filename) {
    // Check project assets first
    const projectAsset = path.join(this.paths.assets, filename);
    if (fs.existsSync(projectAsset)) {
      return projectAsset;
    }
    
    // Check shared assets if enabled in project config
    if (this.projectConfig.build?.useSharedAssets) {
      const sharedAsset = path.join(this.paths.shared, 'assets', filename);
      if (fs.existsSync(sharedAsset)) {
        return sharedAsset;
      }
    }
    
    // Asset not found
    console.warn(
      `[Renderer:${this.projectConfig.projectName}] Asset not found: ${filename}`
    );
    return null;
  }

  /**
   * ENHANCED: Get relative asset path for HTML output
   * 
   * Converts asset filename to relative path for use in HTML
   * Always returns /assets/ prefix for web output
   * 
   * @param {string} filename - Asset filename
   * @returns {string} - Relative path for HTML (e.g., '/assets/images/logo.png')
   */
  getRelativeAssetPath(filename) {
    // Ensure filename doesn't start with slash
    const cleanFilename = filename.startsWith('/') ? filename.substring(1) : filename;
    
    // Return relative path for HTML output
    return `/assets/${cleanFilename}`;
  }

  /**
   * PRESERVED: Citation tag cleanup (part of 75% unchanged)
   * 
   * Removes citation tags and related artifacts from HTML output.
   * Cleans: [cite_start], [cite: N], etc.
   * @param {string} html - Raw HTML string
   * @returns {string} - Cleaned HTML
   */
  cleanCitationTags(html) {
    if (!html || typeof html !== 'string') return html;
    
    // Remove all variations of citation tags
    return html
      .replace(/\[cite_start\]\s*/g, '')   // Remove [cite_start] with optional trailing space
      .replace(/\[cite:\s*\d+\]/g, '')     // Remove [cite: N] where N is any number
      .replace(/\[cite_start\]/g, '')      // Remove any remaining [cite_start]
      .replace(/\s+([<])/g, '$1');         // Clean up any double spaces before tags
  }

  /**
   * PRESERVED: Main rendering logic unchanged
   * 
   * Main Render Logic
   */
  async renderPage(pageId, language = 'en') {
    const pageConfig = this.loadPageConfig(pageId, language);
    this.combinedBlocks = {};
    
    // Performance A: pass target hub to content loader
    const currentHub = pageConfig.hub || 'hub00'; 
    const sources = pageConfig.contentSources || [pageConfig.contentSource];

    sources.forEach(sourceId => {
      const data = this.loadContentData(sourceId, language, currentHub);
      Object.assign(this.combinedBlocks, data.blocks);
    });

    const contentHTML = this.renderCustomSections(pageConfig);
    const rawHTML = this.templates.page({
      site: this.siteConfig,
      page: pageConfig,
      content: this.combinedBlocks,
      contentHTML,
      primaryNav: this.renderPrimaryNav(pageId),
      footer: this.renderFooter()
    });
    
    // Clean citation tags from final output
    return this.cleanCitationTags(rawHTML);
  }

  /**
   * PRESERVED: Custom section rendering unchanged
   * 
   * FIX: Ensures customClass from section.settings is merged into block context for Handlebars.
   */
  renderCustomSections(pageConfig) {
    let html = '';
    pageConfig.sections.forEach(section => {
      const sourceBlock = this.combinedBlocks[section.contentBlock];
      if (!sourceBlock) return;
      const block = JSON.parse(JSON.stringify(sourceBlock));

      // 1. Inject mediaSide positioning metadata
      if (section.layout === 'split-layout' && section.settings.mediaSide) {
        const side = section.settings.mediaSide;
        const textSide = side === 'left' ? 'right' : 'left';
        block.elements.forEach(el => el.position = (el.type === 'media') ? side : textSide);
      }
      
      // 2. Inject customClass into the block context
      // This is CRITICAL for the centering fix in text_block.hbs
      block.customClass = section.settings.customClass; 

      const template = this.templates[section.layout];
      // Pass the augmented block object to the template
      if (template) {
        html += template({ block: block, content: block, ...section.settings });
      }
    });
    return html;
  }

  /**
   * ENHANCED: Uses dynamic paths.src
   * PRESERVED: Direct routing performance optimization unchanged
   * 
   * Performance A: Loads content directly from identified hub.
   */
  loadContentData(sourceId, language, targetHub) {
    // 1. Prioritize direct routing: Search current hub identified in renderPage
    const directPath = path.join(this.paths.src, language, targetHub, `${sourceId}.json`);
    if (fs.existsSync(directPath)) return helpers.loadJSON(directPath);

    // 2. Fallback: Search only if target hub differs (rare authorized cross-hub merge)
    const hubs = ['hub00', 'hub01', 'hub02'].filter(h => h !== targetHub);
    for (const hub of hubs) {
      const p = path.join(this.paths.src, language, hub, `${sourceId}.json`);
      if (fs.existsSync(p)) return helpers.loadJSON(p);
    }
    throw new Error(`Content JSON not found: ${sourceId}`);
  }

  /**
   * ENHANCED: Uses dynamic paths.src
   * PRESERVED: Page config loading logic unchanged
   */
  loadPageConfig(pageId, language) {
    const menuItem = this.findMenuItemById(pageId);
    // Assumes srcFile structure is 'hubXX/pageId'
    const hubId = menuItem.srcFile.split('/')[0]; 
    return helpers.loadJSON(path.join(this.paths.src, language, hubId, `${pageId}_page.json`));
  }

  /**
   * PRESERVED: Menu item search unchanged
   */
  findMenuItemById(id) {
    const search = (items) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.menu.primaryNavigation.items) || search(this.menu.footerNavigation.items);
  }

  /**
   * PRESERVED: Navigation rendering unchanged
   */
  renderPrimaryNav(id) {
    return this.menu.primaryNavigation.items.map(item => ({
      id: item.id, 
      label: item.label, 
      href: item.id === 'home' ? '/' : `/${item.id}.html`, 
      isActive: item.id === id
    }));
  }

  /**
   * PRESERVED: Footer rendering unchanged
   */
  renderFooter() {
    return {
      links: this.menu.footerNavigation.items.map(item => ({ 
        label: item.label, 
        href: `/${item.id}.html` 
      })),
      copyright: `© ${this.siteConfig.footer.copyrightYear} ${this.siteConfig.contact.companyName}`
    };
  }

  /**
   * ENHANCED: Uses dynamic paths.output
   * PRESERVED: File writing logic unchanged
   * 
   * Writes HTML to output directory with citation cleanup
   */
  writeHTML(filename, html) {
    // ENHANCED: Use dynamic output path
    const outputPath = path.join(this.paths.output, filename);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Clean citation tags before writing to file
    const cleanHTML = this.cleanCitationTags(html);
    helpers.writeFileAtomic(outputPath, cleanHTML);
  }
}

module.exports = HTMLRenderer;
