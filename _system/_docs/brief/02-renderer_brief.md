# Continuity Brief: Refactor renderer.js for Multi-Project Support

## Document Information
- **Brief ID**: WEBLY-IMPL-002
- **Component**: renderer.js
- **Task**: Refactor for multi-project architecture
- **Complexity**: Low (15% enhancement)
- **Priority**: Second implementation (after watcher.js)
- **Estimated Effort**: 2-3 hours
- **Date**: 2025-12-25

---

## Context & Background

### Project Status
- **Migration Phase**: Build script refactoring (Step 3 of 6)
- **File Structure**: ✅ Migrated to multi-project layout
- **Configurations**: ✅ `system_config.json` and `project_config.json` created
- **Previous Task**: ✅ watcher.js refactored (WEBLY-IMPL-001)
- **Current Task**: Enhance renderer.js for project awareness

### Why renderer.js Second?
- Minimal changes required (only 15% enhancement)
- Core rendering logic remains unchanged
- Only needs dynamic path resolution
- Used by generator.js, so must be ready first
- Low risk, high confidence

---

## Current renderer.js Overview

### Location
- **Old**: `_buildr/renderer.js`
- **New**: `_system/_buildr/renderer.js` ✅ (already moved)

### Current Functionality
- Compiles Handlebars templates
- Processes 14 element types (title, paragraph, list, media, CTA, form, spacer)
- Renders content blocks using layout patterns
- Assembles complete HTML pages (header, nav, content, footer)
- Handles markdown processing for content
- Writes HTML files to output directory

### Current Behavior (Single-Project Assumptions)
```javascript
// Hardcoded paths:
- Templates: './_templates/'
- Site configs: './site/'
- Output: './_dist/'
- Assets: './assets/'
```

---

## Required Changes

### KEEP (85% - Core Logic)
✅ Template compilation engine  
✅ All 14 element type processors  
✅ Content block assembly logic  
✅ Page composition (header, nav, content, footer)  
✅ Markdown rendering  
✅ HTML generation logic  
✅ Error handling for missing content  
✅ Handlebars helper registration  
✅ All rendering methods  

### ENHANCE (15% - Path Resolution)
🔧 Accept dynamic paths in constructor  
🔧 Accept project configuration in constructor  
🔧 Load templates from `_system/_templates/{version}/`  
🔧 Check shared assets before project assets  
🔧 Support configurable output path  
🔧 Update asset path resolution in templates  

### DEPRECATE
❌ Hardcoded path strings  
❌ Single-project path assumptions  

---

## Target Behavior (Multi-Project)

### Constructor Enhancement
```javascript
// BEFORE (Single Project)
class HTMLRenderer {
  constructor(config) {
    this.templatePath = './_templates/';
    this.sitePath = './site/';
    this.outputPath = './_dist/';
  }
}

// AFTER (Multi Project)
class HTMLRenderer {
  constructor(paths, projectConfig) {
    this.paths = paths;              // Dynamic paths object
    this.projectConfig = projectConfig;  // Project configuration
    this.templatePath = paths.templates;
    this.sitePath = paths.site;
    this.outputPath = paths.output;
  }
}
```

### Path Object Structure
```javascript
const paths = {
  system: './_system/',
  project: './_projects/ips/v1/',
  templates: './_system/_templates/v1.0/',
  shared: './_system/_shared/',
  site: './_projects/ips/v1/site/',
  src: './_projects/ips/v1/src/',
  assets: './_projects/ips/v1/assets/',
  styles: './_projects/ips/v1/styles/',
  scripts: './_projects/ips/v1/scripts/',
  output: './_output/ips-v1/build-20251225-143022/',
  dist: './_projects/ips/v1/_dist/'
};
```

### Asset Resolution Logic
```javascript
// Priority: Project assets > Shared assets
function resolveAssetPath(filename) {
  const projectAsset = `${paths.assets}${filename}`;
  const sharedAsset = `${paths.shared}assets/${filename}`;
  
  if (fs.existsSync(projectAsset)) {
    return projectAsset;  // Project-specific override
  } else if (fs.existsSync(sharedAsset)) {
    return sharedAsset;   // Fallback to shared
  } else {
    console.warn(`Asset not found: ${filename}`);
    return null;
  }
}
```

---

## Configuration Files Reference

### project_config.json (Passed to Constructor)
```json
{
  "projectId": "ips-v1",
  "projectName": "inPowerSuite Website v1",
  "template": {
    "version": "v1.0"
  },
  "paths": {
    "site": "./site/",
    "src": "./src/",
    "assets": "./assets/",
    "styles": "./styles/",
    "scripts": "./scripts/"
  },
  "build": {
    "useSharedStyles": true,
    "useSharedScripts": true,
    "useSharedAssets": true
  }
}
```

---

## Implementation Requirements

### Constructor Update
```javascript
class HTMLRenderer {
  constructor(paths, projectConfig) {
    // Store paths
    this.paths = paths;
    this.projectConfig = projectConfig;
    
    // Initialize Handlebars
    this.handlebars = require('handlebars');
    
    // Load helpers (unchanged)
    this.registerHandlebarsHelpers();
    
    // Initialize template cache
    this.templateCache = {};
    
    // Load configurations
    this.siteConfig = null;
    this.menu = null;
    this.layouts = null;
    this.pageTemplates = null;
  }
}
```

### Initialization Method Update
```javascript
async init() {
  // Load site configurations (dynamic paths)
  this.siteConfig = this.loadJSON(`${this.paths.site}site_config.json`);
  this.menu = this.loadJSON(`${this.paths.site}_menu.json`);
  this.layouts = this.loadJSON(`${this.paths.site}_layouts.json`);
  this.pageTemplates = this.loadJSON(`${this.paths.site}_page-templates.json`);
  
  // Preload and compile templates (dynamic path)
  this.loadTemplates();
  
  console.log(`[Renderer:${this.projectConfig.projectName}] Initialized`);
}
```

### Template Loading Update
```javascript
loadTemplates() {
  // Load from versioned template directory
  const templateDir = this.paths.templates;
  
  // Load partials (site-level patterns)
  const partialsDir = `${templateDir}partials/`;
  const partials = fs.readdirSync(partialsDir);
  partials.forEach(file => {
    const name = path.basename(file, '.hbs');
    const content = fs.readFileSync(`${partialsDir}${file}`, 'utf8');
    this.handlebars.registerPartial(name, content);
  });
  
  // Load layouts (content patterns)
  const layoutsDir = `${templateDir}layouts/`;
  const layouts = fs.readdirSync(layoutsDir);
  layouts.forEach(file => {
    const name = path.basename(file, '.hbs');
    const content = fs.readFileSync(`${layoutsDir}${file}`, 'utf8');
    this.templateCache[name] = this.handlebars.compile(content);
  });
  
  console.log(`[Renderer] Loaded templates from ${templateDir}`);
}
```

### Asset Path Resolution in Rendering
```javascript
processMediaElement(element) {
  const mediaType = element.mediaType || 'image';
  
  if (mediaType === 'image') {
    // Resolve asset path (project > shared)
    const assetPath = this.resolveAssetPath(element.src);
    
    if (!assetPath) {
      console.warn(`[Renderer] Image not found: ${element.src}`);
      return `<img src="/assets/placeholder.png" alt="${element.alt}" />`;
    }
    
    // Return relative path for HTML output
    const relativePath = this.getRelativeAssetPath(element.src);
    return `<img src="${relativePath}" alt="${element.alt}" />`;
  }
  
  // ... rest of media processing
}
```

### Asset Path Resolution Helper
```javascript
resolveAssetPath(filename) {
  // Check project assets first
  const projectAsset = path.join(this.paths.assets, filename);
  if (fs.existsSync(projectAsset)) {
    return projectAsset;
  }
  
  // Check shared assets if enabled
  if (this.projectConfig.build.useSharedAssets) {
    const sharedAsset = path.join(this.paths.shared, 'assets', filename);
    if (fs.existsSync(sharedAsset)) {
      return sharedAsset;
    }
  }
  
  // Not found
  return null;
}
```

### Output Path Support
```javascript
writeHTML(filename, html) {
  // Use dynamic output path
  const outputPath = path.join(this.paths.output, filename);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write file
  fs.writeFileSync(outputPath, html, 'utf8');
}
```

---

## Error Handling Requirements

### Missing Template Version
```javascript
loadTemplates() {
  const templateDir = this.paths.templates;
  
  if (!fs.existsSync(templateDir)) {
    throw new Error(
      `Template version not found: ${this.projectConfig.template.version}\n` +
      `Expected at: ${templateDir}`
    );
  }
  
  // Continue loading...
}
```

### Missing Required Template
```javascript
getTemplate(layoutName) {
  if (!this.templateCache[layoutName]) {
    throw new Error(
      `Template not found: ${layoutName}\n` +
      `Available templates: ${Object.keys(this.templateCache).join(', ')}`
    );
  }
  
  return this.templateCache[layoutName];
}
```

### Missing Asset Warning (Non-Fatal)
```javascript
resolveAssetPath(filename) {
  // ... resolution logic ...
  
  if (!assetPath) {
    console.warn(
      `[Renderer:${this.projectConfig.projectName}] ` +
      `Asset not found: ${filename}`
    );
    // Return null, let caller handle fallback
  }
  
  return assetPath;
}
```

---

## Testing Requirements

### Test Case 1: Template Loading from Versioned Directory
```javascript
// Setup
const paths = {
  templates: './_system/_templates/v1.0/',
  // ... other paths
};
const projectConfig = { template: { version: 'v1.0' } };
const renderer = new HTMLRenderer(paths, projectConfig);

// Execute
await renderer.init();

// Verify
✓ Templates loaded from _system/_templates/v1.0/
✓ All partials registered
✓ All layouts compiled
✓ No errors
```

### Test Case 2: Project Asset Resolution
```javascript
// Setup: Project has custom logo, uses shared checkmark icon

// Test project asset
const logoPath = renderer.resolveAssetPath('images/logo.png');
✓ Returns: _projects/ips/v1/assets/images/logo.png

// Test shared asset
const iconPath = renderer.resolveAssetPath('icons/checkmark.svg');
✓ Returns: _system/_shared/assets/icons/checkmark.svg
```

### Test Case 3: Asset Override (Project Overrides Shared)
```javascript
// Setup: Both project and shared have 'placeholder.png'

const placeholderPath = renderer.resolveAssetPath('placeholder.png');

// Verify priority
✓ Returns project asset (not shared)
✓ Project assets take precedence
```

### Test Case 4: Complete Page Rendering
```javascript
// Setup
const pageId = 'home';
const language = 'en';

// Execute
const html = await renderer.renderPage(pageId, language);

// Verify
✓ HTML generated successfully
✓ Header includes project logo
✓ Navigation rendered
✓ Content blocks rendered with correct layouts
✓ Assets paths are relative (/assets/...)
✓ Footer rendered
✓ Valid HTML structure
```

### Test Case 5: Missing Asset Handling
```javascript
// Setup: Reference non-existent image

const element = {
  type: 'media',
  mediaType: 'image',
  src: 'nonexistent.jpg',
  alt: 'Missing'
};

// Execute
const html = renderer.processMediaElement(element);

// Verify
✓ Warning logged to console
✓ Fallback placeholder image used
✓ No fatal error
✓ Rendering continues
```

### Test Case 6: Output to Dynamic Path
```javascript
// Setup
const paths = {
  output: './_output/ips-v1/build-20251225-143022/'
};

// Execute
renderer.writeHTML('index.html', '<html>...</html>');

// Verify
✓ File written to _output/ips-v1/build-20251225-143022/index.html
✓ Directory created if not exists
✓ No errors
```

---

## Dependencies

### NPM Packages (Already Installed)
- `handlebars` - Template engine
- `marked` (or similar) - Markdown processing
- `fs` - File system operations (built-in)
- `path` - Path utilities (built-in)

### Internal Dependencies
- `helpers.js` - Utility functions (loadJSON, etc.)
- `handlebars_helpers.js` - Custom Handlebars helpers
- Template files in `_system/_templates/{version}/`
- Project configurations

---

## Success Criteria

The refactored `renderer.js` will be considered successful when:

1. ✅ Accepts dynamic paths object in constructor
2. ✅ Accepts project configuration in constructor
3. ✅ Loads templates from versioned directory
4. ✅ Resolves assets with priority (project > shared)
5. ✅ Supports configurable output path
6. ✅ All 14 element types render correctly
7. ✅ Markdown processing works unchanged
8. ✅ Page composition works unchanged
9. ✅ All test cases pass
10. ✅ No breaking changes to rendering logic

---

## Unchanged Methods (85%)

These methods require **NO CHANGES** - keep as-is:

### Element Processors
```javascript
processTitleElement(element)      // ✅ No changes
processParagraphElement(element)  // ✅ No changes
processListElement(element)       // ✅ No changes
processMediaElement(element)      // 🔧 Minor: asset resolution only
processCallToActionElement(element) // ✅ No changes
processFormElement(element)       // ✅ No changes
processSpacerElement(element)     // ✅ No changes
```

### Content Processing
```javascript
processContentBlock(block)        // ✅ No changes
assemblePageContent(blocks)       // ✅ No changes
renderMarkdown(text)              // ✅ No changes
```

### Page Composition
```javascript
renderHeader(config)              // ✅ No changes
renderNavigation(config)          // ✅ No changes
renderFooter(config)              // ✅ No changes
composePage(parts)                // ✅ No changes
```

---

## Files to Reference

When implementing, review these files:

1. **Current renderer.js**: `_system/_buildr/renderer.js`
2. **helpers.js**: `_system/_buildr/helpers.js` (utility functions)
3. **handlebars_helpers.js**: `_system/_buildr/handlebars_helpers.js`
4. **Project config**: `_projects/ips/v1/project_config.json`
5. **System config**: `_system/_buildr/system_config.json`
6. **Template files**: `_system/_templates/v1.0/`

---

## Integration with generator.js

The generator will instantiate renderer like this:

```javascript
// In generator.js
class WebGenBuilder {
  constructor(projectId) {
    // Load configs
    this.systemConfig = this.loadSystemConfig();
    this.projectConfig = this.loadProjectConfig(projectId);
    
    // Build dynamic paths
    const paths = this.buildPaths();
    
    // Create renderer with paths and config
    this.renderer = new HTMLRenderer(paths, this.projectConfig);
  }
  
  buildPaths() {
    const projectBase = `${this.systemConfig.paths.projectsRoot}${this.projectId}/`;
    const templateVersion = this.projectConfig.template.version;
    
    return {
      system: './_system/',
      project: projectBase,
      templates: `./_system/_templates/${templateVersion}/`,
      shared: './_system/_shared/',
      site: `${projectBase}site/`,
      src: `${projectBase}src/`,
      assets: `${projectBase}assets/`,
      styles: `${projectBase}styles/`,
      scripts: `${projectBase}scripts/`,
      output: this.currentOutputPath, // Set by generator
      dist: `${projectBase}_dist/`
    };
  }
}
```

---

## Next Steps After renderer.js

Once renderer.js is complete and tested:

1. ✅ watcher.js refactored (WEBLY-IMPL-001)
2. ✅ renderer.js refactored (WEBLY-IMPL-002)
3. ⏭️ generator.js enhancement (25% changes) - WEBLY-IMPL-003
4. ⏭️ cli.js creation (new file) - WEBLY-IMPL-004
5. ⏭️ build-all.js creation (new file) - WEBLY-IMPL-005
6. ⏭️ package.json scripts update

---

## Implementation Chat Instructions

**Paste this brief into a new chat and request:**

> "Based on this continuity brief, refactor renderer.js to support multi-project architecture. Follow the enhancement strategy (85% keep, 15% enhance). Focus on path resolution and configuration injection. Do not modify core rendering logic. Implement all requirements, error handling, and ensure all test cases pass."

---

## Additional Context

- **Design Philosophy**: Configuration injection, not logic changes
- **Core Principle**: Rendering logic is project-agnostic
- **Testing Strategy**: Test with ips/v1/hub00 sample pages
- **Risk Level**: Very Low (minimal changes to stable code)
- **Dependencies**: Must be complete before generator.js refactoring
- **Repository**: https://github.com/Dlloyd0608/webly

---

## File Structure Reference

```
WEBLY_ROOT/
├── _system/
│   ├── _buildr/
│   │   ├── renderer.js         ← THIS FILE (to be refactored)
│   │   ├── helpers.js          ← Used by renderer
│   │   ├── handlebars_helpers.js ← Used by renderer
│   │   └── system_config.json
│   │
│   ├── _templates/
│   │   └── v1.0/               ← Load templates from here
│   │       ├── partials/
│   │       └── layouts/
│   │
│   └── _shared/
│       └── assets/             ← Fallback asset location
│
├── _projects/
│   └── ips/
│       └── v1/
│           ├── project_config.json  ← Passed to renderer
│           ├── site/           ← Load configs from here
│           ├── src/            ← Load content from here
│           └── assets/         ← Primary asset location
│
└── _output/
    └── ips-v1/
        └── build-YYYYMMDD-HHMMSS/  ← Write output here
```

---

**END OF BRIEF**
