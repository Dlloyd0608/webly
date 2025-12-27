

# Codebase Dependency Matrix
```
┌─────────────────────────────────────────────────────────────────────┐
│                     WEBLY BUILD SYSTEM DEPENDENCIES                 │
└─────────────────────────────────────────────────────────────────────┘

LEGEND:
  → Direct dependency (imports/requires)
  ⇢ Uses via execution (execSync)
  ◆ Reads configuration from
  ■ System-level (unchanged)
  ● Refactored (WEBLY-IMPL-001-003)
  ○ New files (WEBLY-IMPL-004-005)


┌──────────────────────┐
│ CONFIGURATION FILES  │
└──────────────────────┘
  ■ system_config.json        (System-wide settings)
  ■ project_config.json       (Per-project settings)
  ■ site_config.json          (Site identity/branding)
  ■ _menu.json                (Navigation structure)
  ■ _layouts.json             (Layout definitions)
  ■ _page-templates.json      (Page patterns)


┌──────────────────────┐
│   HELPER MODULES     │
│   (No Changes)       │
└──────────────────────┘
  ■ helpers.js              ← Pure utilities
  ■ handlebars_helpers.js   ← Template helpers


┌──────────────────────┐
│   CORE BUILD FILES   │
└──────────────────────┘

● watcher.js (WEBLY-IMPL-001)
   ├─→ helpers.js
   ├─◆ system_config.json
   ├─◆ project_config.json
   └─⇢ generator.js (via npm run build)

● renderer.js (WEBLY-IMPL-002)
   ├─→ helpers.js
   ├─→ handlebars_helpers.js (registers)
   ├─◆ site_config.json
   ├─◆ _menu.json
   ├─◆ _layouts.json
   └─◆ _page-templates.json

● generator.js (WEBLY-IMPL-003)
   ├─→ renderer.js (instantiates)
   ├─→ helpers.js
   ├─◆ system_config.json
   └─◆ project_config.json

○ cli.js (WEBLY-IMPL-004)
   ├─→ helpers.js
   ├─◆ system_config.json
   └─◆ project_config.json

○ build-all.js (WEBLY-IMPL-005)
   ├─→ helpers.js
   ├─◆ system_config.json
   └─⇢ generator.js (via npm run build)
```

Detailed Dependency Relationships

generator.js (Build Orchestrator)
```
generator.js
  ├─→ CREATES: new renderer.js(paths, projectConfig)
  ├─→ USES: helpers.js (loadJSON, etc.)
  ├─◆ READS: system_config.json
  ├─◆ READS: project_config.json
  └─◆ WRITES: project_config.json (updates lastBuilt)

  CALLED BY:
    - watcher.js (via execSync)
    - build-all.js (via execSync)
    - Direct CLI: npm run build -- --project=X
```

## renderer.js (HTML Generator)
```
renderer.js
  ├─→ USES: helpers.js (loadJSON, processMarkdown, etc.)
  ├─→ REGISTERS: handlebars_helpers.js
  ├─◆ READS: site_config.json
  ├─◆ READS: _menu.json
  ├─◆ READS: _layouts.json
  ├─◆ READS: _page-templates.json
  ├─◆ READS: *.page.json (page definitions)
  ├─◆ READS: *.content.json (page content)
  └─◆ READS: Template files (*.hbs)

  INSTANTIATED BY:
    - generator.js
```

## watcher.js (Dev Mode)
```
watcher.js
  ├─→ USES: helpers.js
  ├─◆ READS: system_config.json
  ├─◆ READS: project_config.json
  ├─⇢ EXECUTES: npm run build -- --project=X
  └─→ STARTS: browser-sync server

  RUN BY:
    - npm run dev -- --project=X
```

## cli.js (Project Management)
```
cli.js
  ├─→ USES: helpers.js (loadJSON, writeJSON)
  ├─◆ READS: system_config.json
  ├─◆ READS: project_config.json
  ├─◆ WRITES: project_config.json (create, clone, archive, upgrade)
  └─◆ CREATES: Project directories and files

  RUN BY:
    - npm run project:list
    - npm run project:create -- --id=X
    - npm run clean -- --project=X
    - etc.
```

## build-all.js (Multi-Project Orchestrator)
```
build-all.js
  ├─→ USES: helpers.js
  ├─◆ READS: system_config.json
  ├─◆ SCANS: All project_config.json files
  └─⇢ EXECUTES: npm run build -- --project=X (for each)

  RUN BY:
    - npm run build:all
```

# Execution Flow Diagram

## Development Mode (npm run dev)
```
USER
  ↓
npm run dev -- --project=ips-v1
  ↓
watcher.js
  ├─→ Loads system_config.json
  ├─→ Loads project_config.json (ips-v1)
  ├─→ Watches project files
  ├─→ Starts browser-sync
  │
  └─→ ON FILE CHANGE:
        ↓
      execSync('npm run build -- --project=ips-v1')
        ↓
      generator.js
        ├─→ Loads configs
        ├─→ Creates renderer.js
        ├─→ Builds pages
        └─→ Writes to _output/
```


## Single Project Build (npm run build)
```
USER
  ↓
npm run build -- --project=ips-v1
  ↓
generator.js
  ├─→ Loads system_config.json
  ├─→ Loads project_config.json (ips-v1)
  ├─→ Resolves template version
  ├─→ Builds dynamic paths
  │
  ├─→ Creates renderer.js(paths, projectConfig)
  │     ↓
  │   renderer.js
  │     ├─→ Loads site configs
  │     ├─→ Compiles templates
  │     ├─→ Registers handlebars_helpers.js
  │     ├─→ Renders pages (uses helpers.js)
  │     └─→ Writes HTML files
  │
  ├─→ Copies assets (project + shared)
  ├─→ Creates symlink (latest)
  ├─→ Cleans old builds
  ├─→ [Optional] Promotes to _dist
  └─→ Updates project_config.json (lastBuilt)
```

## Multi-Project Build (npm run build:all)
```
USER
  ↓
npm run build:all
  ↓
build-all.js
  ├─→ Loads system_config.json
  ├─→ Discovers all projects
  ├─→ Filters by status (active)
  │
  └─→ FOR EACH PROJECT (sequential):
        ↓
      execSync('npm run build -- --project=X')
        ↓
      [Same as Single Project Build above]
```

## File Count Summary

### Unchanged Files (4)

✅ helpers.js - 100% unchanged
✅ handlebars_helpers.js - 100% unchanged
✅ All template files (*.hbs) - 100% unchanged
✅ All configuration schemas - 100% unchanged

### Refactored Files (3)

🔧 watcher.js - 75% keep, 25% enhance
🔧 renderer.js - 85% keep, 15% enhance
🔧 generator.js - 70% keep, 25% enhance

### New Files (2)

✨ cli.js - New creation
✨ build-all.js - New creation


## Key Insights

1. Helper files are universal utilities - No project awareness needed
2. All refactored files use helpers - Stable foundation
3. No breaking changes to helpers - Everything else adapts around them
4. Clean separation of concerns - Each module has single responsibility
5. Configuration-driven - Behavior controlled by JSON files, not code


