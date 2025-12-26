# Continuity Brief: Refactor watcher.js for Multi-Project Support

## Document Information
- **Brief ID**: WEBLY-IMPL-001
- **Component**: watcher.js
- **Task**: Refactor for multi-project architecture
- **Complexity**: Low-Medium (25% enhancement)
- **Priority**: First implementation (warmup task)
- **Estimated Effort**: 2-3 hours
- **Date**: 2025-12-25

---

## Context & Background

### Project Status
- **Migration Phase**: Build script refactoring (Step 3 of 6)
- **File Structure**: ✅ Migrated to multi-project layout
- **Configurations**: ✅ `system_config.json` and `project_config.json` created
- **Current Task**: Enhance build scripts for project awareness

### Why watcher.js First?
- Simpler enhancement (good warmup before tackling generator.js)
- Self-contained functionality (file watching + browser-sync)
- Lower risk than generator.js refactoring
- Quick win to validate approach

---

## Current watcher.js Overview

### Location
- **Old**: `_buildr/watcher.js`
- **New**: `_system/_buildr/watcher.js` ✅ (already moved)

### Current Functionality
- Watches source files for changes (content, pages, site configs, templates, styles)
- Triggers incremental builds on file changes
- Manages browser-sync for live reload
- Debounces rapid file changes (500ms)
- Starts local development server (port 3000)

### Current Behavior (Single-Project Assumptions)
```javascript
// Watches these paths (hardcoded):
- ./src/**/*_content.json
- ./src/**/*_page.json
- ./site/**/*.json
- ./templates/**/*.hbs
- ./styles/**/*.css
```

---

## Required Changes

### KEEP (75% - Core Logic)
✅ File watching with chokidar  
✅ Debouncing logic (500ms)  
✅ Browser-sync integration  
✅ Live reload functionality  
✅ Change detection and event handling  
✅ Error handling structure  

### ENHANCE (25% - Project Awareness)
🔧 Accept `projectId` parameter (from CLI: `--project=ips-v1`)  
🔧 Load `system_config.json` and `project_config.json`  
🔧 Build project-specific watch paths dynamically  
🔧 Pass `projectId` to build trigger  
🔧 Use project-specific browser-sync port (avoid conflicts)  
🔧 Update console logging to show project name  

### DEPRECATE
❌ Hardcoded watch paths  
❌ Global/single-project assumptions  

---

## Target Behavior (Multi-Project)

### Command Line Usage
```bash
# Watch specific project
npm run dev -- --project=ips-v1

# System should:
# 1. Parse --project argument
# 2. Load configs for ips-v1
# 3. Watch ONLY ips-v1 files
# 4. Trigger builds with project context
# 5. Start browser-sync on project-specific port
```

### Dynamic Watch Paths (Example)
For `projectId = "ips-v1"`:
```javascript
Watch:
- _projects/ips/v1/src/**/*_content.json
- _projects/ips/v1/src/**/*_page.json
- _projects/ips/v1/site/**/*.json
- _system/_templates/v1.0/**/*.hbs  (shared templates)
- _projects/ips/v1/styles/**/*.css
```

### Browser-Sync Port Strategy
Avoid port conflicts when running multiple watchers:
```javascript
Base port: 3000
Project-specific: 3000 + hash(projectId) % 100
Example: ips-v1 → port 3042
```

---

## Configuration Files Reference

### system_config.json Location
`_system/_buildr/system_config.json`

**Relevant Fields**:
```json
{
  "paths": {
    "projectsRoot": "./_projects/",
    "templatesRoot": "./_system/_templates/"
  },
  "watch": {
    "debounceMs": 500
  },
  "server": {
    "port": 3000,
    "open": false,
    "notify": false
  }
}
```

### project_config.json Location
`_system/project_config.json` (template/reference)  
`_projects/ips/v1/project_config.json` (actual instance)

**Relevant Fields**:
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
    "styles": "./styles/"
  }
}
```

---

## Implementation Requirements

### Input Parameters
```javascript
// CLI: npm run dev -- --project=ips-v1
// Parse from process.argv
const projectId = getProjectIdFromArgs(); // e.g., "ips-v1"
```

### Configuration Loading
```javascript
1. Load system_config.json from _system/_buildr/
2. Extract projectsRoot path
3. Build project config path: `${projectsRoot}${projectId}/project_config.json`
   Example: ./_projects/ips/v1/project_config.json
4. Load project_config.json
5. Extract template version and paths
```

### Path Resolution Logic
```javascript
const projectBase = `${systemConfig.paths.projectsRoot}${projectId}/`;
// Example: ./_projects/ips/v1/

Watch paths:
1. Content: `${projectBase}${projectConfig.paths.src}**/*_content.json`
2. Pages: `${projectBase}${projectConfig.paths.src}**/*_page.json`
3. Site: `${projectBase}${projectConfig.paths.site}**/*.json`
4. Templates: `${systemConfig.paths.templatesRoot}${projectConfig.template.version}/**/*.hbs`
5. Styles: `${projectBase}${projectConfig.paths.styles}**/*.css`
```

### Build Trigger Enhancement
When file changes detected:
```javascript
// BEFORE (single-project)
execSync('npm run build');

// AFTER (multi-project)
execSync(`npm run build -- --project=${projectId}`);
```

### Browser-Sync Configuration
```javascript
// Generate project-specific port
function getProjectPort(projectId, basePort) {
  const hash = projectId.split('').reduce((acc, char) => 
    acc + char.charCodeAt(0), 0);
  return basePort + (hash % 100);
}

const port = getProjectPort(projectId, systemConfig.server.port);
// Example: ips-v1 → 3042
```

### Console Logging Enhancement
```javascript
// Show project name in all log messages
console.log(`[Watcher:${projectConfig.projectName}] Watching for changes...`);
console.log(`[Watcher:${projectConfig.projectName}] File changed: ${filename}`);
console.log(`[Watcher:${projectConfig.projectName}] Server running at http://localhost:${port}`);
```

---

## Error Handling Requirements

### Missing Project ID
```javascript
if (!projectId) {
  console.error('[Watcher] ERROR: --project parameter required');
  console.error('Usage: npm run dev -- --project=ips-v1');
  process.exit(1);
}
```

### Invalid Project ID
```javascript
const projectPath = `${projectsRoot}${projectId}/project_config.json`;
if (!fs.existsSync(projectPath)) {
  console.error(`[Watcher] ERROR: Project '${projectId}' not found`);
  console.error(`Expected config at: ${projectPath}`);
  process.exit(1);
}
```

### Template Version Not Found
```javascript
const templatePath = `${templatesRoot}${templateVersion}/`;
if (!fs.existsSync(templatePath)) {
  console.error(`[Watcher] ERROR: Template version '${templateVersion}' not found`);
  console.error(`Expected templates at: ${templatePath}`);
  process.exit(1);
}
```

---

## Testing Requirements

### Test Case 1: Valid Project Watch
```bash
npm run dev -- --project=ips-v1

Expected:
✓ Loads system_config.json
✓ Loads project_config.json
✓ Watches project-specific paths only
✓ Starts browser-sync on project port
✓ Console shows project name in logs
✓ File changes trigger rebuild with --project=ips-v1
```

### Test Case 2: Missing Project Parameter
```bash
npm run dev

Expected:
✗ Shows error message
✗ Shows usage example
✗ Exits with code 1
```

### Test Case 3: Invalid Project ID
```bash
npm run dev -- --project=nonexistent

Expected:
✗ Shows "Project not found" error
✗ Shows expected config path
✗ Exits with code 1
```

### Test Case 4: File Change Detection
```bash
npm run dev -- --project=ips-v1
# Edit: _projects/ips/v1/src/en/hub00/home.content.json

Expected:
✓ Detects file change
✓ Logs: "File changed: home.content.json"
✓ Triggers: npm run build -- --project=ips-v1
✓ Browser auto-refreshes
```

### Test Case 5: Template Change (Shared)
```bash
npm run dev -- --project=ips-v1
# Edit: _system/_templates/v1.0/layouts/split_layout.hbs

Expected:
✓ Detects template change (affects all projects using v1.0)
✓ Triggers rebuild for ips-v1
✓ Browser auto-refreshes
```

---

## Dependencies

### NPM Packages (Already Installed)
- `chokidar` - File watching
- `browser-sync` - Live reload server
- `fs` - File system operations (built-in)
- `path` - Path utilities (built-in)
- `child_process` - For triggering builds (built-in)

### Internal Dependencies
- `system_config.json` - System configuration
- `project_config.json` - Project configuration
- `generator.js` - Build script (called via npm run build)

---

## Success Criteria

The refactored `watcher.js` will be considered successful when:

1. ✅ Accepts `--project` parameter from CLI
2. ✅ Loads both system and project configurations
3. ✅ Watches ONLY project-specific files (no cross-contamination)
4. ✅ Uses project-specific browser-sync port
5. ✅ Triggers builds with project context
6. ✅ Shows project name in console logs
7. ✅ Handles errors gracefully (missing project, invalid paths)
8. ✅ Detects changes to shared templates (affects project)
9. ✅ All test cases pass
10. ✅ No changes required to `helpers.js` or `handlebars_helpers.js`

---

## Files to Reference

When implementing, review these files:

1. **Current watcher.js**: `_system/_buildr/watcher.js`
2. **System config**: `_system/_buildr/system_config.json`
3. **Project config template**: `_system/project_config.json`
4. **Actual project config**: `_projects/ips/v1/project_config.json`
5. **Design document**: `_system/_docs/multi-project-structure.md`

---

## Next Steps After watcher.js

Once watcher.js is complete and tested:

1. ✅ watcher.js refactored
2. ⏭️ renderer.js enhancement (15% changes)
3. ⏭️ generator.js enhancement (25% changes)
4. ⏭️ cli.js creation (new file)
5. ⏭️ build-all.js creation (new file)
6. ⏭️ package.json scripts update

---

## Implementation Chat Instructions

**Paste this brief into a new chat and request:**

> "Based on this continuity brief, refactor watcher.js to support multi-project architecture. Follow the enhancement strategy (75% keep, 25% enhance). Implement all requirements, error handling, and ensure all test cases pass. Maintain code quality and readability."

---

## Additional Context

- **Design Philosophy**: Surgical enhancement, not rebuild
- **Backward Compatibility**: Not required (commit fully to multi-project)
- **Testing Strategy**: Batch enhancements, test with ips/v1/hub00 files
- **Risk Level**: Low (watcher.js is self-contained)
- **Repository**: https://github.com/Dlloyd0608/webly

---

## File Structure Reference

```
WEBLY_ROOT/
├── _system/
│   ├── _buildr/
│   │   ├── watcher.js          ← THIS FILE (to be refactored)
│   │   ├── generator.js        ← Will call with --project
│   │   ├── renderer.js
│   │   ├── helpers.js
│   │   ├── handlebars_helpers.js
│   │   └── system_config.json  ← Load from here
│   │
│   ├── _templates/
│   │   └── v1.0/               ← Watch shared templates
│   │
│   └── _docs/
│       └── multi-project-structure.md
│
├── _projects/
│   └── ips/
│       └── v1/
│           ├── project_config.json  ← Load from here
│           ├── site/           ← Watch these
│           ├── src/            ← Watch these
│           └── styles/         ← Watch these
│
└── package.json
```

---

**END OF BRIEF**
