#!/usr/bin/env node
// ./_system/_buildr/watcher.js
// File watcher for multi-project architecture
// Monitors project-specific files and triggers builds with project context

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const browserSync = require('browser-sync').create();

class WebGenWatcher {
  constructor(projectId) {
    if (!projectId) {
      console.error('[Watcher] ERROR: --project parameter required');
      console.error('Usage: npm run dev -- --project=ips-v1');
      process.exit(1);
    }

    this.projectId = projectId;
    
    // Load configurations
    this.systemConfig = this.loadSystemConfig();
    this.projectConfig = this.loadProjectConfig();
    
    this.isBuilding = false;
    this.buildQueue = [];
    this.debounceTimer = null;
  }

  /**
   * Load system configuration
   */
  loadSystemConfig() {
    const configPath = path.join(__dirname, 'system_config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('[Watcher] ERROR: System config not found at:', configPath);
      process.exit(1);
    }
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      console.log('[Watcher] ✓ Loaded system_config.json');
      return config;
    } catch (error) {
      console.error('[Watcher] ERROR: Failed to parse system config:', error.message);
      process.exit(1);
    }
  }

  /**
   * Load project configuration
   */
  loadProjectConfig() {
    const projectPath = `${this.systemConfig.paths.projectsRoot}${this.projectId}/project_config.json`;
    
    if (!fs.existsSync(projectPath)) {
      console.error(`[Watcher] ERROR: Project '${this.projectId}' not found`);
      console.error(`Expected config at: ${projectPath}`);
      process.exit(1);
    }
    
    try {
      const content = fs.readFileSync(projectPath, 'utf8');
      const config = JSON.parse(content);
      console.log(`[Watcher] ✓ Loaded project_config.json for '${config.projectName}'`);
      
      // Validate template version exists
      this.validateTemplateVersion(config.template.version);
      
      return config;
    } catch (error) {
      console.error('[Watcher] ERROR: Failed to parse project config:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate template version exists
   */
  validateTemplateVersion(templateVersion) {
    const templatePath = `${this.systemConfig.paths.templatesRoot}${templateVersion}/`;
    
    if (!fs.existsSync(templatePath)) {
      console.error(`[Watcher] ERROR: Template version '${templateVersion}' not found`);
      console.error(`Expected templates at: ${templatePath}`);
      process.exit(1);
    }
  }

  /**
   * Build project-specific watch patterns
   */
  buildWatchPatterns() {
    const projectBase = `${this.systemConfig.paths.projectsRoot}${this.projectId}/`;
    const templateVersion = this.projectConfig.template.version;
    
    const patterns = [
      // Project content files
      `${projectBase}${this.projectConfig.paths.src}**/*_content.json`,
      
      // Project page files
      `${projectBase}${this.projectConfig.paths.src}**/*_page.json`,
      
      // Project site configuration files
      `${projectBase}${this.projectConfig.paths.site}**/*.json`,
      
      // Shared template files (affects this project)
      `${this.systemConfig.paths.templatesRoot}${templateVersion}/**/*.hbs`,
      
      // Project styles
      `${projectBase}${this.projectConfig.paths.styles}**/*.css`
    ];
    
    return patterns;
  }

  /**
   * Generate project-specific browser-sync port
   */
  getProjectPort() {
    const basePort = this.systemConfig.server.port || 3000;
    
    // Generate hash from projectId
    const hash = this.projectId.split('').reduce((acc, char) => 
      acc + char.charCodeAt(0), 0);
    
    return basePort + (hash % 100);
  }

  /**
   * Start watching
   */
  start() {
    const projectName = this.projectConfig.projectName;
    
    console.log(`\n[Watcher:${projectName}] Starting...\n`);
    
    // Start browser-sync with project-specific port
    const port = this.getProjectPort();
    const distPath = `${this.systemConfig.paths.projectsRoot}${this.projectId}/dist`;
    
    browserSync.init({
      server: distPath,
      port: port,
      notify: this.systemConfig.server.notify !== undefined ? 
        this.systemConfig.server.notify : false,
      open: this.systemConfig.server.open !== undefined ? 
        this.systemConfig.server.open : false
    });
    
    console.log(`[Watcher:${projectName}] ✓ Server running at http://localhost:${port}\n`);
    
    // Build watch patterns
    const watchPatterns = this.buildWatchPatterns();
    
    // Watch paths
    const debounceMs = this.systemConfig.watch?.debounceMs || 500;
    
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
    
    console.log(`[Watcher:${projectName}] Watching for changes\n`);
    console.log('Watch patterns:');
    watchPatterns.forEach(pattern => {
      console.log(`  - ${pattern}`);
    });
    console.log('');
  }

  /**
   * Handle file change
   */
  handleChange(filepath) {
    const projectName = this.projectConfig.projectName;
    const filename = path.basename(filepath);
    
    console.log(`\n[${this.timestamp()}] [Watcher:${projectName}] File changed: ${filename}`);
    
    // Add to queue
    this.buildQueue.push(filepath);
    
    // Debounce (wait for more changes)
    const debounceMs = this.systemConfig.watch?.debounceMs || 500;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, debounceMs);
  }

  /**
   * Process queued changes
   */
  async processQueue() {
    const projectName = this.projectConfig.projectName;
    
    if (this.isBuilding) {
      console.log(`[Watcher:${projectName}] Build already in progress, queuing...`);
      return;
    }
    
    const files = [...this.buildQueue];
    this.buildQueue = [];
    
    if (files.length === 0) return;
    
    this.isBuilding = true;
    
    try {
      // Trigger build with project context
      // Generator.js will determine rebuild scope automatically
      console.log(`[Watcher:${projectName}] → Triggering build`);
      console.log(`[Watcher:${projectName}] → Running: npm run build -- --project=${this.projectId}\n`);
      
      await this.runCommand(`npm run build -- --project=${this.projectId}`);
      
      // Refresh browser
      browserSync.reload();
      console.log(`[Watcher:${projectName}] ✓ Build complete, browser refreshed\n`);
      
    } catch (error) {
      console.error(`[Watcher:${projectName}] ✗ Build error:`, error.message);
    } finally {
      this.isBuilding = false;
      console.log(`[Watcher:${projectName}] Watching for changes\n`);
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
   * Get timestamp
   */
  timestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }
}

/**
 * Parse --project parameter from command line
 */
function getProjectIdFromArgs() {
  const args = process.argv.slice(2);
  
  for (const arg of args) {
    if (arg.startsWith('--project=')) {
      return arg.split('=')[1];
    }
  }
  
  return null;
}

// Start watcher
if (require.main === module) {
  const projectId = getProjectIdFromArgs();
  const watcher = new WebGenWatcher(projectId);
  watcher.start();
}

module.exports = WebGenWatcher;
