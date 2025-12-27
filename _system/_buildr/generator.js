#!/usr/bin/env node
// ./_system/_buildr/generator.js
// Multi-Project Build Orchestrator for WebGen
// Refactored: WEBLY-IMPL-003 (75% keep / 25% enhance)

const fs = require('fs');
const path = require('path');
const HTMLRenderer = require('./renderer');

// ============================================================================
// HELPER FUNCTIONS (Top Level)
// ============================================================================

/**
 * Parse command line arguments
 * @returns {Object} Parsed options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectId: null,
    fullRebuild: false,
    promote: false,
    file: null
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--project=')) {
      options.projectId = arg.substring(10);
    } else if (arg === '--full-rebuild') {
      options.fullRebuild = true;
    } else if (arg === '--promote' || arg === '--promote-to-dist') {
      options.promote = true;
    } else if (arg.startsWith('--file=')) {
      options.file = arg.substring(7);
    }
  });
  
  return options;
}

// ============================================================================
// MAIN BUILDER CLASS
// ============================================================================

class WebGenBuilder {
  /**
   * Constructor - Enhanced for multi-project support
   * @param {string} projectId - Project identifier (e.g., "ips-v1" or "client-abc")
   * @param {Object} buildOptions - Build configuration options
   */
  constructor(projectId, buildOptions = {}) {
    this.projectId = projectId;
    this.buildOptions = buildOptions;
    
    // Load configurations
    this.systemConfig = this.loadSystemConfig();
    this.projectConfig = this.loadProjectConfig(projectId);
    
    // Resolve template version based on policy
    this.templateVersion = this.resolveTemplateVersion();
    
    // Build dynamic paths
    this.paths = this.buildPaths();
    
    // Initialize renderer with new signature
    this.renderer = new HTMLRenderer(this.paths, this.projectConfig);
    
    // Dependency graph (unchanged core structure)
    this.dependencyGraph = {};
  }

  // ==========================================================================
  // CONFIGURATION LOADING (NEW - 25% Enhancement)
  // ==========================================================================

  /**
   * Load system configuration
   * @returns {Object} System configuration object
   */
  loadSystemConfig() {
    const configPath = path.join(__dirname, 'system_config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        `System configuration not found at: ${configPath}\n` +
        `Please ensure system_config.json exists in _system/_buildr/`
      );
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`[Builder] Loaded system config v${config.version}`);
    
    return config;
  }

  /**
   * Load project configuration
   * @param {string} projectId - Project identifier
   * @returns {Object} Project configuration object
   */
  loadProjectConfig(projectId) {
    const projectPath = this.resolveProjectPath(projectId);
    const configPath = path.join(projectPath, 'project_config.json');
    
    if (!fs.existsSync(configPath)) {
      const available = this.listAvailableProjects();
      throw new Error(
        `Project '${projectId}' not found\n` +
        `Expected config at: ${configPath}\n` +
        `Available projects: ${available.join(', ')}`
      );
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`[Builder] Loaded project: ${config.projectName}`);
    
    return config;
  }

  /**
   * Resolve project path from project ID
   * Handles both versioned (ips-v1) and simple (client-abc) formats
   * @param {string} projectId - Project identifier
   * @returns {string} Full path to project directory
   */
  resolveProjectPath(projectId) {
    const projectsRoot = this.systemConfig.paths.projectsRoot;
    
    // Check for versioned format (e.g., "ips-v1" or "ips-v10")
    const versionMatch = projectId.match(/^(.+)-v(\d+)$/);
    if (versionMatch) {
      const [, name, version] = versionMatch;
      return path.join(projectsRoot, name, `v${version}`);
    }
    
    // Simple format (e.g., "client-abc")
    return path.join(projectsRoot, projectId);
  }

  /**
   * List all available projects by scanning for project_config.json files
   * @returns {string[]} Array of project IDs
   */
  listAvailableProjects() {
    const projectsRoot = this.systemConfig.paths.projectsRoot;
    const projects = [];
    
    const scanDir = (dir, depth = 0) => {
      if (depth > 2) return; // Limit recursion depth
      
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (entry.name === 'project_config.json') {
          try {
            const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            projects.push(config.projectId);
          } catch (e) {
            // Skip invalid config files
          }
        }
      });
    };
    
    scanDir(projectsRoot);
    return projects;
  }

  /**
   * Resolve template version based on project policy
   * Handles manual, auto, and locked upgrade policies
   * @returns {string} Resolved template version
   */
  resolveTemplateVersion() {
    const projectVersion = this.projectConfig.template.version;
    const projectPolicy = this.projectConfig.template.upgradePolicy || 'manual';
    const systemLatest = this.systemConfig.templates.latestVersion;
    
    let resolvedVersion = projectVersion;
    
    // Handle upgrade policy
    if (projectPolicy === 'auto') {
      if (projectVersion !== systemLatest) {
        console.log(
          `[Builder] Auto-upgrading template: ${projectVersion} → ${systemLatest}`
        );
        resolvedVersion = systemLatest;
      }
    } else if (projectPolicy === 'locked') {
      console.log(
        `[Builder] Template version locked at: ${projectVersion}`
      );
    } else {
      // manual (default)
      console.log(
        `[Builder] Using template version: ${projectVersion}`
      );
    }
    
    // Verify version exists
    const templatePath = path.join(
      this.systemConfig.paths.templatesRoot,
      resolvedVersion
    );
    
    if (!fs.existsSync(templatePath)) {
      const available = this.systemConfig.templates.supportedVersions;
      throw new Error(
        `Template version '${resolvedVersion}' not found\n` +
        `Expected at: ${templatePath}\n` +
        `Available versions: ${available.join(', ')}`
      );
    }
    
    return resolvedVersion;
  }

  /**
   * Build dynamic paths based on project and system configuration
   * @returns {Object} Path configuration object
   */
  buildPaths() {
    const projectPath = this.resolveProjectPath(this.projectId);
    
    // Generate timestamp for output (if enabled)
    let outputPath;
    if (this.projectConfig.build.outputToTimestampedFolder) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5); // YYYY-MM-DDTHH-MM-SS
      outputPath = path.join(
        this.systemConfig.paths.outputRoot,
        this.projectId,
        `build-${timestamp}`
      );
    } else {
      outputPath = path.join(
        this.systemConfig.paths.outputRoot,
        this.projectId
      );
    }
    
    return {
      system: './_system/',
      project: projectPath,
      templates: path.join(
        this.systemConfig.paths.templatesRoot,
        this.templateVersion
      ),
      shared: this.systemConfig.paths.sharedRoot,
      site: path.join(projectPath, this.projectConfig.paths.site),
      src: path.join(projectPath, this.projectConfig.paths.src),
      assets: path.join(projectPath, this.projectConfig.paths.assets),
      styles: path.join(projectPath, this.projectConfig.paths.styles),
      scripts: path.join(projectPath, this.projectConfig.paths.scripts),
      output: outputPath,
      dist: path.join(projectPath, this.projectConfig.paths.dist)
    };
  }

  // ==========================================================================
  // BUILD ORCHESTRATION (KEPT - 75% Core Logic)
  // ==========================================================================

  /**
   * Main build orchestration method
   * @param {Object} options - Build options
   */
  async build(options = {}) {
    const startTime = Date.now();
    
    console.log('='.repeat(60));
    console.log(`Building: ${this.projectConfig.projectName}`);
    console.log(`Project ID: ${this.projectId}`);
    console.log(`Template: ${this.templateVersion}`);
    console.log(`Output: ${this.paths.output}`);
    console.log('='.repeat(60));
    
    try {
      // Initialize renderer
      await this.renderer.init();
      
      // Build dependency graph
      this.buildDependencyGraph();
      
      // Execute build based on mode
      if (options.fullRebuild) {
        await this.buildAllPages();
      } else if (options.file) {
        await this.buildAffectedPages(options.file);
      } else {
        await this.buildAllPages();
      }
      
      // Copy assets
      await this.copyAssets();
      
      // Create symlink to latest
      await this.createLatestSymlink();
      
      // Cleanup old builds
      await this.cleanupOldBuilds();
      
      // Optionally promote to _dist
      if (this.projectConfig.build.promoteToDist || options.promote) {
        await this.promoteToStable();
      }
      
      // Update build timestamp
      this.updateBuildTimestamp();
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log('='.repeat(60));
      console.log(`✓ Build complete in ${elapsed}s`);
      console.log(`Output: ${this.paths.output}`);
      if (this.projectConfig.build.promoteToDist || options.promote) {
        console.log(`Promoted to: ${this.paths.dist}`);
      }
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('='.repeat(60));
      console.error(`✗ Build failed: ${error.message}`);
      console.error('='.repeat(60));
      throw error;
    }
  }

  /**
   * Build dependency graph from menu structure
   * KEPT - Core logic unchanged
   */
  buildDependencyGraph() {
    console.log('[Builder] Building dependency graph...');
    
    const menu = this.renderer.menu;
    
    const processMenuItem = (item) => {
      if (item.id) {
        const pageId = item.id;
        try {
          const pageConfig = this.renderer.loadPageConfig(pageId, 'en');
          const contentId = pageConfig.contentSource || pageConfig.contentSources[0];
          
          if (!this.dependencyGraph[contentId]) {
            this.dependencyGraph[contentId] = [];
          }
          this.dependencyGraph[contentId].push(pageId);
        } catch (e) {
          // Silent catch for non-existent pages
        }
      }
      if (item.children) {
        item.children.forEach(processMenuItem);
      }
    };
    
    menu.primaryNavigation.items.forEach(processMenuItem);
    
    console.log('[Builder] Dependency graph complete');
  }

  /**
   * Build all pages in parallel
   * KEPT - Core parallel rendering logic unchanged
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
    
    console.log(`[Builder] Rendering ${pages.length} pages...`);
    
    const renderQueue = pages.map(async (pageId) => {
      try {
        await this.buildPage(pageId);
      } catch (error) {
        console.error(`[Builder] ✗ Error rendering ${pageId}: ${error.message}`);
      }
    });
    
    await Promise.all(renderQueue);
  }

  /**
   * Build pages affected by content change
   * KEPT - Core dependency logic unchanged
   */
  async buildAffectedPages(changedFile) {
    if (changedFile.includes('.content.json')) {
      const contentId = path.basename(changedFile, '.content.json');
      const affected = this.dependencyGraph[contentId] || [];
      
      console.log(`[Builder] Content '${contentId}' changed, rebuilding ${affected.length} pages`);
      
      await Promise.all(affected.map(pageId => this.buildPage(pageId)));
    } else {
      console.log('[Builder] Non-content file changed, rebuilding all pages');
      await this.buildAllPages();
    }
  }

  /**
   * Build individual page
   * ENHANCED - Output path now uses this.paths.output
   */
  async buildPage(pageId, language = 'en') {
    try {
      const html = await this.renderer.renderPage(pageId, language);
      let filename = `${pageId}.html`;
      if (pageId === 'home') filename = 'index.html';
      
      const outputPath = path.join(this.paths.output, filename);
      
      this.renderer.writeHTML(outputPath, html);
      console.log(`[Builder] ✓ Generated: ${filename}`);
    } catch (error) {
      console.error(`[Builder] ✗ Error on ${pageId}: ${error.message}`);
      throw error;
    }
  }

  // ==========================================================================
  // ASSET MANAGEMENT (ENHANCED - 25%)
  // ==========================================================================

  /**
   * Copy assets with shared/project layering
   * ENHANCED - Supports shared assets and multiple asset types
   */
  async copyAssets() {
    console.log('[Builder] Copying assets...');
    
    // 1. Copy shared assets first (base layer)
    if (this.projectConfig.build.useSharedAssets) {
      const sharedAssetsPath = path.join(this.paths.shared, 'assets');
      if (fs.existsSync(sharedAssetsPath)) {
        this.copyDirectory(
          sharedAssetsPath,
          path.join(this.paths.output, 'assets', 'shared')
        );
      }
    }
    
    // 2. Copy project assets (overwrites shared if conflicts)
    if (fs.existsSync(this.paths.assets)) {
      this.copyDirectory(
        this.paths.assets,
        path.join(this.paths.output, 'assets')
      );
    }
    
    // 3. Copy shared styles
    if (this.projectConfig.build.useSharedStyles) {
      const sharedStylesPath = path.join(this.paths.shared, 'styles');
      if (fs.existsSync(sharedStylesPath)) {
        this.copyDirectory(
          sharedStylesPath,
          path.join(this.paths.output, 'styles', 'shared')
        );
      }
    }
    
    // 4. Copy project styles
    if (fs.existsSync(this.paths.styles)) {
      this.copyDirectory(
        this.paths.styles,
        path.join(this.paths.output, 'styles')
      );
    }
    
    // 5. Copy shared scripts
    if (this.projectConfig.build.useSharedScripts) {
      const sharedScriptsPath = path.join(this.paths.shared, 'scripts');
      if (fs.existsSync(sharedScriptsPath)) {
        this.copyDirectory(
          sharedScriptsPath,
          path.join(this.paths.output, 'scripts', 'shared')
        );
      }
    }
    
    // 6. Copy project scripts
    if (fs.existsSync(this.paths.scripts)) {
      this.copyDirectory(
        this.paths.scripts,
        path.join(this.paths.output, 'scripts')
      );
    }
    
    console.log('[Builder] ✓ Assets copied');
  }

  /**
   * Recursive directory copy helper
   * KEPT - Core copy logic unchanged
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(src)) return;
    
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // ==========================================================================
  // OUTPUT MANAGEMENT (NEW - 25% Enhancement)
  // ==========================================================================

  /**
   * Create symlink to latest build
   * NEW - Cross-platform with graceful fallback
   */
  async createLatestSymlink() {
    if (!this.systemConfig.output.createSymlinkToLatest) {
      return;
    }
    
    const latestPath = path.join(
      this.systemConfig.paths.outputRoot,
      this.projectId,
      'latest'
    );
    
    try {
      // Remove existing symlink or directory
      if (fs.existsSync(latestPath)) {
        fs.unlinkSync(latestPath);
      }
      
      // Create new symlink
      const target = path.basename(this.paths.output);
      fs.symlinkSync(target, latestPath, 'dir');
      
      console.log(`[Builder] ✓ Created symlink: latest → ${target}`);
    } catch (error) {
      // Graceful degradation for Windows without admin rights
      console.warn(`[Builder] Could not create symlink: ${error.message}`);
      console.warn('[Builder] (Symlinks may require admin privileges on Windows)');
      // Continue without symlink - not critical
    }
  }

  /**
   * Promote build to stable _dist directory
   * NEW - With backup preservation
   */
  async promoteToStable() {
    console.log('[Builder] Promoting build to stable (_dist)...');
    
    const distPath = this.paths.dist;
    
    try {
      // Backup existing _dist if it exists
      if (fs.existsSync(distPath)) {
        const backupPath = `${distPath}.backup-${Date.now()}`;
        console.log(`[Builder] Backing up current _dist to ${path.basename(backupPath)}`);
        fs.renameSync(distPath, backupPath);
      }
      
      // Copy from _output to _dist
      this.copyDirectory(this.paths.output, distPath);
      
      console.log(`[Builder] ✓ Promoted to ${distPath}`);
      
    } catch (error) {
      console.error(`[Builder] ✗ Promotion failed: ${error.message}`);
      console.warn(`[Builder] Backup preserved at: ${distPath}.backup-*`);
      console.warn('[Builder] Manual recovery may be required');
      // Don't throw - build succeeded, just promotion failed
    }
  }

  /**
   * Cleanup old builds, keeping only recent ones
   * NEW - Automatic cleanup based on system config
   */
  async cleanupOldBuilds() {
    const maxKeep = this.systemConfig.output.maxBuildsToKeep;
    const outputBase = path.join(
      this.systemConfig.paths.outputRoot,
      this.projectId
    );
    
    if (!fs.existsSync(outputBase)) {
      return;
    }
    
    try {
      // Get all build directories
      const builds = fs.readdirSync(outputBase)
        .filter(name => name.startsWith('build-'))
        .map(name => ({
          name,
          path: path.join(outputBase, name),
          time: fs.statSync(path.join(outputBase, name)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first
      
      // Keep only the latest N builds
      if (builds.length > maxKeep) {
        const toDelete = builds.slice(maxKeep);
        
        console.log(`[Builder] Cleaning up ${toDelete.length} old build(s)...`);
        
        toDelete.forEach(build => {
          console.log(`[Builder] Removing: ${build.name}`);
          fs.rmSync(build.path, { recursive: true, force: true });
        });
      }
    } catch (error) {
      console.warn(`[Builder] Could not cleanup old builds: ${error.message}`);
      // Non-critical, continue
    }
  }

  /**
   * Update build timestamp in project config
   * NEW - Tracks last successful build
   */
  updateBuildTimestamp() {
    try {
      this.projectConfig.lastBuilt = new Date().toISOString();
      this.projectConfig.lastModified = new Date().toISOString();
      
      const configPath = path.join(
        this.resolveProjectPath(this.projectId),
        'project_config.json'
      );
      
      fs.writeFileSync(
        configPath,
        JSON.stringify(this.projectConfig, null, 2),
        'utf8'
      );
    } catch (error) {
      console.warn(`[Builder] Could not update build timestamp: ${error.message}`);
      // Non-critical, continue
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  const options = parseArgs();
  
  // Validate required parameters
  if (!options.projectId) {
    console.error('[Builder] ERROR: --project parameter required');
    console.error('Usage: npm run build -- --project=ips-v1');
    console.error('       npm run build -- --project=ips-v1 --promote');
    console.error('       npm run build -- --project=ips-v1 --full-rebuild');
    process.exit(1);
  }
  
  // Create builder and execute
  try {
    const builder = new WebGenBuilder(options.projectId, options);
    builder.build(options);
  } catch (error) {
    console.error(`[Builder] Fatal error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = WebGenBuilder;