# Continuity Brief: Refactor generator.js for Multi-Project Support

## Document Information
- **Brief ID**: WEBLY-IMPL-003
- **Component**: generator.js
- **Task**: Refactor for multi-project architecture
- **Complexity**: Medium (25% enhancement)
- **Priority**: Third implementation (after watcher.js and renderer.js)
- **Estimated Effort**: 4-6 hours
- **Date**: 2025-12-25

---

## Context & Background

### Project Status
- **Migration Phase**: Build script refactoring (Step 3 of 6)
- **File Structure**: ✅ Migrated to multi-project layout
- **Configurations**: ✅ `system_config.json` and `project_config.json` created
- **Previous Tasks**: 
  - ✅ watcher.js refactored (WEBLY-IMPL-001)
  - ✅ renderer.js refactored (WEBLY-IMPL-002)
- **Current Task**: Enhance generator.js for project awareness

### Why generator.js Third?
- Most complex refactoring (25% enhancement)
- Requires watcher.js and renderer.js to be complete
- Central orchestrator for entire build process
- Adds new features (output management, promotion, cleanup)
- Higher complexity but still manageable

---

## Current generator.js Overview

### Location
- **Old**: `_buildr/generator.js`
- **New**: `_system/_buildr/generator.js` ✅ (already moved)

### Current Functionality
- Main build orchestrator
- Loads configurations from hardcoded paths
- Discovers pages from `_menu.json`
- Builds dependency graph (content → pages)
- Orchestrates parallel page rendering
- Copies static assets to output
- Handles full and incremental builds
- Manages build timing and logging

### Current Behavior (Single-Project Assumptions)
```javascript
// Hardcoded paths in constructor
this.config = {
  paths: {
    build: "./_buildr/",
    templates: "./_templates/",
    site: "./site/",
    src: "./src/",
    styles: "./styles/",
    dist: "./_dist/",
    assets: "./assets/"
  }
};

// Single output destination
outputPath = "./_dist/"
```

---

## Required Changes

### KEEP (70% - Core Logic)
✅ Build orchestration flow  
✅ Dependency graph building  
✅ Page discovery from menu  
✅ Parallel rendering with `Promise.all`  
✅ Asset copying logic  
✅ Error handling structure  
✅ Build timing/logging  
✅ Incremental vs. full build logic  

### ENHANCE (25% - Project Awareness + Output Management)
🔧 Accept `projectId` parameter from CLI  
🔧 Load `system_config.json` and `project_config.json`  
🔧 Resolve template version (manual/auto/locked policy)  
🔧 Build dynamic paths based on project  
🔧 Create timestamped output directories  
🔧 Manage dual output (_output + _dist)  
🔧 Implement promotion to _dist  
🔧 Add build cleanup (old builds)  
🔧 Update build timestamp in project config  
🔧 Create symlink to latest build  

### DEPRECATE (5%)
❌ Hardcoded path strings  
❌ Single-project assumptions  
❌ Direct write to _dist  

---

## Target Behavior (Multi-Project)

### Command Line Usage
```bash
# Build to timestamped _output directory
npm run build -- --project=ips-v1

# Build and promote to _dist (stable)
npm run build -- --project=ips-v1 --promote

# Full rebuild (clear cache)
npm run build -- --project=ips-v1 --full-rebuild
```

### Constructor Enhancement
```javascript
// BEFORE (Single Project)
class WebGenBuilder {
  constructor() {
    this.config = { paths: { /* hardcoded */ } };
    this.renderer = new HTMLRenderer(this.config);
  }
}

// AFTER (Multi Project)
class WebGenBuilder {
  constructor(projectId, options = {}) {
    this.projectId = projectId;
    this.buildOptions = options;
    
    // Load configurations
    this.systemConfig = this.loadSystemConfig();
    this.projectConfig = this.loadProjectConfig(projectId);
    
    // Resolve template version based on policy
    this.templateVersion = this.resolveTemplateVersion();
    
    // Build dynamic paths
    this.paths = this.buildPaths();
    
    // Create renderer with dynamic paths
    this.renderer = new HTMLRenderer(this.paths, this.projectConfig);
    
    this.dependencyGraph = {};
  }
}
```

---

## Configuration Loading

### Load System Configuration
```javascript
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
```

### Load Project Configuration
```javascript
loadProjectConfig(projectId) {
  // Parse projectId to extract directory path
  // Example: "ips-v1" → "_projects/ips/v1/"
  const projectPath = this.resolveProjectPath(projectId);
  const configPath = path.join(projectPath, 'project_config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Project '${projectId}' not found\n` +
      `Expected config at: ${configPath}\n` +
      `Available projects: ${this.listAvailableProjects().join(', ')}`
    );
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`[Builder] Loaded project: ${config.projectName}`);
  
  return config;
}
```

### Resolve Project Path
```javascript
resolveProjectPath(projectId) {
  // Handle different project ID formats
  // "ips-v1" → "_projects/ips/v1/"
  // "client-abc" → "_projects/client-abc/"
  
  const projectsRoot = this.systemConfig.paths.projectsRoot;
  
  // Check for versioned format (e.g., "ips-v1")
  const match = projectId.match(/^(.+)-v(\d+)$/);
  if (match) {
    const [, name, version] = match;
    return path.join(projectsRoot, name, `v${version}`);
  }
  
  // Simple format (e.g., "client-abc")
  return path.join(projectsRoot, projectId);
}
```

### List Available Projects
```javascript
listAvailableProjects() {
  const projectsRoot = this.systemConfig.paths.projectsRoot;
  const projects = [];
  
  // Recursively find all project_config.json files
  const scanDir = (dir, depth = 0) => {
    if (depth > 2) return; // Limit recursion
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name), depth + 1);
      } else if (entry.name === 'project_config.json') {
        const config = JSON.parse(
          fs.readFileSync(path.join(dir, entry.name), 'utf8')
        );
        projects.push(config.projectId);
      }
    });
  };
  
  scanDir(projectsRoot);
  return projects;
}
```

---

## Template Version Resolution

### Resolve Template Version
```javascript
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
    throw new Error(
      `Template version '${resolvedVersion}' not found\n` +
      `Expected at: ${templatePath}\n` +
      `Available versions: ${this.systemConfig.templates.supportedVersions.join(', ')}`
    );
  }
  
  return resolvedVersion;
}
```

---

## Dynamic Path Building

### Build Paths Method
```javascript
buildPaths() {
  const projectsRoot = this.systemConfig.paths.projectsRoot;
  const projectPath = this.resolveProjectPath(this.projectId);
  const projectBase = path.join(projectsRoot, projectPath);
  
  // Generate timestamp for output
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, -5); // YYYYMMDD-HHMMSS
  
  const outputPath = this.projectConfig.build.outputToTimestampedFolder
    ? path.join(this.systemConfig.paths.outputRoot, this.projectId, `build-${timestamp}`)
    : path.join(this.systemConfig.paths.outputRoot, this.projectId);
  
  return {
    system: './_system/',
    project: projectBase,
    templates: path.join(
      this.systemConfig.paths.templatesRoot,
      this.templateVersion
    ),
    shared: this.systemConfig.paths.sharedRoot,
    site: path.join(projectBase, this.projectConfig.paths.site),
    src: path.join(projectBase, this.projectConfig.paths.src),
    assets: path.join(projectBase, this.projectConfig.paths.assets),
    styles: path.join(projectBase, this.projectConfig.paths.styles),
    scripts: path.join(projectBase, this.projectConfig.paths.scripts),
    output: outputPath,
    dist: path.join(projectBase, this.projectConfig.paths.dist)
  };
}
```

---

## Build Process Enhancement

### Main Build Method
```javascript
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
    
    // Execute build
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
```

### Dependency Graph (Unchanged Core Logic)
```javascript
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
```

### Build All Pages (Unchanged Core Logic)
```javascript
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
```

---

## Output Management (NEW)

### Create Latest Symlink
```javascript
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
    // Remove existing symlink
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    
    // Create new symlink
    const target = path.basename(this.paths.output);
    fs.symlinkSync(target, latestPath, 'dir');
    
    console.log(`[Builder] ✓ Created symlink: latest → ${target}`);
  } catch (error) {
    console.warn(`[Builder] Could not create symlink: ${error.message}`);
  }
}
```

### Promote to Stable (_dist)
```javascript
async promoteToStable() {
  console.log('[Builder] Promoting build to stable (_dist)...');
  
  const distPath = this.paths.dist;
  
  // Backup existing _dist if it exists
  if (fs.existsSync(distPath)) {
    const backupPath = `${distPath}.backup-${Date.now()}`;
    console.log(`[Builder] Backing up current _dist to ${backupPath}`);
    fs.renameSync(distPath, backupPath);
  }
  
  // Copy from _output to _dist
  this.copyDirectory(this.paths.output, distPath);
  
  console.log(`[Builder] ✓ Promoted to ${distPath}`);
}
```

### Cleanup Old Builds
```javascript
async cleanupOldBuilds() {
  const maxKeep = this.systemConfig.output.maxBuildsToKeep;
  const outputBase = path.join(
    this.systemConfig.paths.outputRoot,
    this.projectId
  );
  
  if (!fs.existsSync(outputBase)) {
    return;
  }
  
  // Get all build directories
  const builds = fs.readdirSync(outputBase)
    .filter(name => name.startsWith('build-'))
    .map(name => ({
      name,
      path: path.join(outputBase, name),
      time: fs.statSync(path.join(outputBase, name)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  // Keep only the latest N builds
  if (builds.length > maxKeep) {
    const toDelete = builds.slice(maxKeep);
    
    toDelete.forEach(build => {
      console.log(`[Builder] Cleaning up old build: ${build.name}`);
      fs.rmSync(build.path, { recursive: true, force: true });
    });
  }
}
```

### Update Build Timestamp
```javascript
updateBuildTimestamp() {
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
}
```

---

## Asset Copying (Enhanced)

### Copy Assets Method
```javascript
async copyAssets() {
  console.log('[Builder] Copying assets...');
  
  // 1. Copy shared assets (if enabled)
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
  
  // 3. Copy styles
  if (this.projectConfig.build.useSharedStyles) {
    const sharedStylesPath = path.join(this.paths.shared, 'styles');
    if (fs.existsSync(sharedStylesPath)) {
      this.copyDirectory(
        sharedStylesPath,
        path.join(this.paths.output, 'styles', 'shared')
      );
    }
  }
  
  if (fs.existsSync(this.paths.styles)) {
    this.copyDirectory(
      this.paths.styles,
      path.join(this.paths.output, 'styles')
    );
  }
  
  // 4. Copy scripts
  if (this.projectConfig.build.useSharedScripts) {
    const sharedScriptsPath = path.join(this.paths.shared, 'scripts');
    if (fs.existsSync(sharedScriptsPath)) {
      this.copyDirectory(
        sharedScriptsPath,
        path.join(this.paths.output, 'scripts', 'shared')
      );
    }
  }
  
  if (fs.existsSync(this.paths.scripts)) {
    this.copyDirectory(
      this.paths.scripts,
      path.join(this.paths.output, 'scripts')
    );
  }
  
  console.log('[Builder] ✓ Assets copied');
}
```

### Copy Directory Helper (Unchanged)
```javascript
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
```

---

## CLI Argument Parsing

### Parse Arguments
```javascript
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
```

### Main Execution
```javascript
if (require.main === module) {
  const options = parseArgs();
  
  // Validate required parameters
  if (!options.projectId) {
    console.error('[Builder] ERROR: --project parameter required');
    console.error('Usage: npm run build -- --project=ips-v1');
    console.error('       npm run build -- --project=ips-v1 --promote');
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
```

---

## Error Handling Requirements

### Missing Project
```javascript
// Handled in loadProjectConfig()
throw new Error(
  `Project '${projectId}' not found\n` +
  `Expected config at: ${configPath}\n` +
  `Available projects: ${this.listAvailableProjects().join(', ')}`
);
```

### Missing Template Version
```javascript
// Handled in resolveTemplateVersion()
throw new Error(
  `Template version '${version}' not found\n` +
  `Expected at: ${templatePath}\n` +
  `Available versions: ${supportedVersions.join(', ')}`
);
```

### Build Failures
```javascript
// Wrapped in try-catch in build()
catch (error) {
  console.error('='.repeat(60));
  console.error(`✗ Build failed: ${error.message}`);
  console.error('='.repeat(60));
  throw error;
}
```

---

## Testing Requirements

### Test Case 1: Basic Build to _output
```bash
npm run build -- --project=ips-v1

Expected:
✓ Loads system_config.json
✓ Loads project_config.json for ips-v1
✓ Resolves template version v1.0
✓ Creates timestamped output: _output/ips-v1/build-YYYYMMDD-HHMMSS/
✓ Generates all pages
✓ Copies assets (shared + project)
✓ Creates symlink: _output/ips-v1/latest/
✓ Cleans up old builds (keeps last 10)
✓ Updates lastBuilt timestamp in project_config.json
✓ _dist/ is NOT modified (no promotion)
```

### Test Case 2: Build with Promotion
```bash
npm run build -- --project=ips-v1 --promote

Expected:
✓ All Test Case 1 results
✓ Backs up existing _dist/ (if exists)
✓ Copies _output to _projects/ips/v1/_dist/
✓ Logs promotion message
```

### Test Case 3: Auto Template Upgrade
```json
// In project_config.json
{
  "template": {
    "version": "v1.0",
    "upgradePolicy": "auto"
  }
}

// system_config.json has latestVersion: "v1.1"
```

```bash
npm run build -- --project=ips-v1

Expected:
✓ Detects auto upgrade policy
✓ Logs: "Auto-upgrading template: v1.0 → v1.1"
✓ Uses templates from _system/_templates/v1.1/
✓ Build succeeds
```

### Test Case 4: Invalid Project
```bash
npm run build -- --project=nonexistent

Expected:
✗ Shows error: "Project 'nonexistent' not found"
✗ Shows expected config path
✗ Lists available projects
✗ Exits with code 1
```

### Test Case 5: Missing Project Parameter
```bash
npm run build

Expected:
✗ Shows error: "--project parameter required"
✗ Shows usage examples
✗ Exits with code 1
```

### Test Case 6: Cleanup Old Builds
```bash
# After running 12 builds (maxBuildsToKeep = 10)

Expected:
✓ Only 10 most recent builds remain
✓ 2 oldest builds deleted
✓ Logs cleanup messages
```

---

## Dependencies

### NPM Packages (Already Installed)
- `fs` - File system operations (built-in)
- `path` - Path utilities (built-in)
- `child_process` - For CLI execution (built-in)

### Internal Dependencies
- ✅ `renderer.js` - Must be refactored first (WEBLY-IMPL-002)
- ✅ `helpers.js` - No changes needed
- ✅ `system_config.json` - Configuration file
- ✅ `project_config.json` - Per-project configuration

---

## Success Criteria

The refactored `generator.js` will be considered successful when:

1. ✅ Accepts `--project` parameter from CLI
2. ✅ Loads system and project configurations
3. ✅ Resolves template version (manual/auto/locked)
4. ✅ Builds dynamic paths for project
5. ✅ Creates timestamped output directories
6. ✅ Creates symlink to latest build
7. ✅ Cleans up old builds automatically
8. ✅ Supports promotion to _dist
9. ✅ Updates build timestamp
10. ✅ Handles errors gracefully
11. ✅ All core build logic works unchanged
12. ✅ All test cases pass

---

## Files to Reference

When implementing, review these files:

1. **Current generator.js**: `_system/_buildr/generator.js`
2. **Refactored renderer.js**: `_system/_buildr/renderer.js` (WEBLY-IMPL-002)
3. **System config**: `_system/_buildr/system_config.json`
4. **Project config template**: `_system/project_config.json`
5. **Actual project config**: `_projects/ips/v1/project_config.json`
6. **helpers.js**: `_system/_buildr/helpers.js`

---

## Next Steps After generator.js

Once generator.js is complete and tested:

1. ✅ watcher.js refactored (WEBLY-IMPL-001)
2. ✅ renderer.js refactored (WEBLY-IMPL-002)
3. ✅ generator.js refactored (WEBLY-IMPL-003)
4. ⏭️ cli.js creation (new file) - WEBLY-IMPL-004
5. ⏭️ build-all.js creation (new file) - WEBLY-IMPL-005
6. ⏭️ package.json scripts update

---

## Implementation Chat Instructions

**Paste this brief into a new chat and request:**

> "Based on this continuity brief, refactor generator.js to support multi-project architecture. Follow the enhancement strategy (70% keep, 25% enhance, 5% deprecate). Focus on project awareness, configuration loading, template version resolution, and output management. Keep core build logic intact. Implement all requirements, error handling, and ensure all test cases pass."

---

## Additional Context

- **Design Philosophy**: Surgical enhancement, not rebuild
- **Core Principle**: Keep build orchestration logic intact
- **New Features**: Output management, promotion, cleanup, timestamp tracking
- **Testing Strategy**: Test with ips/v1 project
- **Risk Level**: Medium (more changes than watcher/renderer, but still manageable)
- **Dependencies**: Requires renderer.js refactoring complete
- **Repository**: https://github.com/Dlloyd0608/webly

---

## File Structure Reference

```
WEBLY_ROOT/
├── _system/
│   ├── _buildr/
│   │   ├── generator.js        ← THIS FILE (to be refactored)
│   │   ├── renderer.js         ← Refactored (WEBLY-IMPL-002)
│   │   ├── helpers.js          ← No changes
│   │   └── system_config.json  ← Load from here
│   │
│   └── _templates/
│       ├── v1.0/               ← Template version resolution
│       └── v1.1/
│
├── _projects/
│   └── ips/
│       └── v1/
│           ├── project_config.json  ← Load from here
│           ├── site/
│           ├── src/
│           ├── assets/
│           └── _dist/          ← Promotion target
│
└── _output/
    └── ips-v1/
        ├── build-20251225-143022/  ← Timestamped builds
        ├── build-20251225-091543/
        └── latest/                  ← Symlink to most recent
```

---

**END OF BRIEF**
