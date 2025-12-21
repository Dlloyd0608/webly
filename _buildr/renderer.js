/**
 * file: ./build/renderer.js
 * Optimized Core Rendering Engine
 * * Performance Fix A: Direct Routing for Content (bypasses deep hub search).
 * * Performance Fix B: Pre-compiled Layout Caching (with noComments: true).
 * * Logo Fix: Constructs absolute logo paths from site_config.json metadata.
 * * Centering Fix: Passes section settings (customClass) correctly to templates.
 * * CRITICAL FIX: Applies { noComments: true } to ALL compilations to strip any remaining
 * comment artifacts like [cite] tags that may have been leaked during prior builds.
 * * CITATION CLEANUP: Removes [cite] and tags from final HTML output.
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const helpers = require('./helpers');
const { registerHandlebarsHelpers } = require('./handlebars_helpers');

// Define global compilation options to ensure cleanliness and functionality
const COMPILATION_OPTIONS = { noComments: true };

class HTMLRenderer {
  constructor(buildConfig) {
    this.buildConfig = buildConfig;
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
    
    this.mediaBasePath = null;
    this.mediaFallbackPath = null;
    this.language = this.buildConfig.languages ? this.buildConfig.languages.default : 'en';
  }

  /**
   * Initializes SSR Environment. Registers helpers once globally.
   */
  async init() {
    console.log('[Renderer] Initializing SSR Environment (Optimized)...');
    await this.loadSiteConfigs();
    await this.loadTemplates(); // Compiles all layouts into cache
    registerHandlebarsHelpers(this.buildConfig, this.mediaBasePath, this.mediaFallbackPath);
  }

  async loadSiteConfigs() {
    const sitePath = this.buildConfig.paths.site;
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
   * Performance B: Compiles and caches all required partials and templates.
   * FIX: Applies { noComments: true } to ensure clean HTML and fix centering bug.
   */
  async loadTemplates() {
    const templatesPath = this.buildConfig.paths.templates;

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
    const masterContent = fs.readFileSync(path.join(templatesPath, 'page_master.hbs'), 'utf8');
    this.templates['page'] = Handlebars.compile(masterContent, COMPILATION_OPTIONS);
  }

  /**
   * Removes citation tags and related artifacts from HTML output.
   * Cleans: ,, 
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
   * Performance A: Loads content directly from identified hub.
   */
  loadContentData(sourceId, language, targetHub) {
    // 1. Prioritize direct routing: Search current hub identified in renderPage
    const directPath = path.join(this.buildConfig.paths.src, language, targetHub, `${sourceId}.json`);
    if (fs.existsSync(directPath)) return helpers.loadJSON(directPath);

    // 2. Fallback: Search only if target hub differs (rare authorized cross-hub merge)
    const hubs = ['hub00', 'hub01', 'hub02'].filter(h => h !== targetHub);
    for (const hub of hubs) {
      const p = path.join(this.buildConfig.paths.src, language, hub, `${sourceId}.json`);
      if (fs.existsSync(p)) return helpers.loadJSON(p);
    }
    throw new Error(`Content JSON not found: ${sourceId}`);
  }

  // Baseline load/search utils preserved below...
  loadPageConfig(pageId, language) {
    const menuItem = this.findMenuItemById(pageId);
    // Assumes srcFile structure is 'hubXX/pageId'
    const hubId = menuItem.srcFile.split('/')[0]; 
    return helpers.loadJSON(path.join(this.buildConfig.paths.src, language, hubId, `${pageId}_page.json`));
  }

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

  renderPrimaryNav(id) {
    return this.menu.primaryNavigation.items.map(item => ({
      id: item.id, label: item.label, href: item.id === 'home' ? '/' : `/${item.id}.html`, isActive: item.id === id
    }));
  }

  renderFooter() {
    return {
      links: this.menu.footerNavigation.items.map(item => ({ label: item.label, href: `/${item.id}.html` })),
      copyright: `© ${this.siteConfig.footer.copyrightYear} ${this.siteConfig.contact.companyName}`
    };
  }

  writeHTML(filepath, html) {
    // Clean citation tags before writing to file
    const cleanHTML = this.cleanCitationTags(html);
    helpers.writeFileAtomic(filepath, cleanHTML);
  }
}

module.exports = HTMLRenderer;
