
# Multi-Project File Structure Design Document

**Document Information**

- Document ID: WEBLY-DESIGN-003
- Title: Multi-Project File Structure Architecture
- Version: 1.0
- Date: 2025-12-22
- Status: Approved for Implementation
- Author: Webly Design Team
- Related Documents:

-- overview.md (System Overview)
-- content_patterns_spec2.md (Content Patterns)
-- open-questions.md (Requirements Clarifications)



## 1. Executive Summary

1.1 Purpose
This document defines the file structure architecture for Webly's transition from a single-project system to a multi-project platform capable of managing unlimited website projects from a centralized system.

### 1.2 Scope

- System-level organization (_system/)
- Project-level organization (_projects/)
- Build output structure (_output/ and _dist/)
- Configuration file schemas
- Template versioning strategy
- Shared resource management

### 1.3 Key Design Goals

- Scalability: Support unlimited projects without conflicts
- Maintainability: Single source of truth for templates and build tools
- Isolation: Complete project independence
- Versioning: Template evolution without breaking existing projects
- Flexibility: Parameter-driven configuration for project-specific needs
- Clarity: Clear separation of system vs. project concerns

## 2. Architectural Principles

### 2.1 Separation of Concerns
System-Level Resources (Universal, Versioned, Shared)

- Build engine and tools
- Template library (versioned)
- Shared CSS/JS frameworks
- Universal assets (icons, placeholders)
- System documentation

Project-Level Resources (Isolated, Independent, Customizable)

- Site configuration
- Content (multi-language, multi-hub)
- Project-specific assets
- Custom styles and scripts
- Build output

### 2.2 Template Versioning Philosophy
Templates are versioned, universal assets that:

Live in _system/_templates/{version}/
- Are available to all projects
- Support multiple concurrent versions (v1.0, v1.1, v2.0)
- Allow projects to choose upgrade policy (manual, auto, locked)
- Enable gradual migration without forced upgrades

### 2.4 Dual Output Strategy
Projects maintain two build destinations:
_dist/ (Stable/Live)

- Current production-ready build
- Lives inside project directory
- Manually promoted from _output/
- Represents "last known good" state

_output/{project-id}/ (Latest/Staging)

- Timestamped builds (build-YYYYMMDD-HHMMSS/)
- Testing and validation environment
- Automatic cleanup of old builds
- Symlink to latest/ for convenience


## 3. Directory Structure


### 3.1 Directory Structure Summary
```
WEBLY_ROOT/
│
├── _system/                          # System-level resources
│   ├── _buildr/                      # Build engine (Node.js)
│   ├── _templates/                   # Universal templates (versioned)
│   │   ├── v1.0/
│   │   │   ├── partials/             # Site-level patterns
│   │   │   └── layouts/              # Content patterns
│   │   ├── v1.1/
│   │   └── v2.0/
│   ├── _shared/                      # Shared resources
│   │   ├── assets/                   # Universal images/icons
│   │   │   ├── icons/
│   │   │   └── system/
│   │   ├── styles/                   # Base CSS framework
│   │   └── scripts/                  # Common JS libraries
│   ├── _docs/                        # System documentation
│   └── _logs/                        # System-wide build logs
│
├── _projects/                        # All website projects
│   ├── inpowersuite/                 # Example Project 1
│   │   ├── project_config.json       # Project metadata + settings
│   │   ├── site/                     # Site configuration
│   │   ├── src/                      # Content source files
│   │   │   ├── en/                   # English content
│   │   │   │   ├── hub00/            # Home hub
│   │   │   │   ├── hub01/            # Markets hub
│   │   │   │   └── hub02/            # Features hub
│   │   │   ├── es/                   # Spanish content
│   │   │   └── fr/                   # French content
│   │   ├── assets/                   # Project-specific media
│   │   │   ├── images/
│   │   │   ├── videos/
│   │   │   └── documents/
│   │   ├── styles/                   # Project-specific CSS
│   │   ├── scripts/                  # Project-specific JS
│   │   └── _dist/                    # STABLE/LIVE build output
│   ├── client-abc/                   # Example Project 2
│   └── client-xyz/                   # Example Project 3
│
├── _output/                          # Latest builds (staging/testing)
│   ├── inpowersuite/
│   │   ├── build-20251222-143022/    # Timestamped build
│   │   ├── build-20251222-091543/    # Previous build
│   │   └── latest/                   # Symlink to most recent build
│   ├── client-abc/
│   └── client-xyz/
│
└── package.json                      # Node.js dependencies
```


### 3.2 Complete File Structure

```
WEBLY_ROOT/
│
├── _system/                          # System-level resources
│   │
│   ├── _buildr/                      # Build engine (Node.js)
│   │   ├── generator.js              # Main build orchestrator
│   │   ├── renderer.js               # HTML rendering engine
│   │   ├── helpers.js                # Utility functions
│   │   ├── handlebars_helpers.js     # Template helpers
│   │   ├── watcher.js                # File watcher for dev mode
│   │   ├── build-all.js              # Multi-project build script
│   │   ├── cli.js                    # Command-line interface
│   │   └── system_config.json        # System-wide configuration
│   │
│   ├── _templates/                   # Universal templates (versioned)
│   │   │
│   │   ├── v1.0/                     # Template version 1.0
│   │   │   ├── partials/             # Site-level patterns
│   │   │   │   ├── announcement_banner.hbs
│   │   │   │   ├── header.hbs
│   │   │   │   ├── navigation.hbs
│   │   │   │   └── footer.hbs
│   │   │   │
│   │   │   └── layouts/              # Content patterns
│   │   │       ├── split_layout.hbs
│   │   │       ├── stacked_image_top.hbs
│   │   │       ├── stacked_image_bottom.hbs
│   │   │       ├── complex_split.hbs
│   │   │       ├── grid_layout.hbs
│   │   │       ├── two_column_subtitles.hbs
│   │   │       ├── multi_title_lists.hbs
│   │   │       ├── form_1_up.hbs
│   │   │       ├── form_2_up.hbs
│   │   │       ├── text_block.hbs
│   │   │       └── page_master.hbs
│   │   │
│   │   ├── v1.1/                     # Template version 1.1
│   │   │   └── (same structure, improved templates)
│   │   │
│   │   └── v2.0/                     # Template version 2.0
│   │       └── (same structure, next-gen templates)
│   │
│   ├── _shared/                      # Shared resources
│   │   │
│   │   ├── assets/                   # Universal images/icons
│   │   │   ├── icons/
│   │   │   │   ├── checkmark.svg
│   │   │   │   ├── arrow-right.svg
│   │   │   │   ├── bullet.svg
│   │   │   │   └── placeholder.png
│   │   │   │
│   │   │   └── system/
│   │   │       ├── webly-logo.png
│   │   │       └── default-hero.jpg
│   │   │
│   │   ├── styles/                   # Base CSS framework
│   │   │   ├── reset.css             # CSS reset/normalize
│   │   │   ├── typography.css        # Font system
│   │   │   ├── layout-utilities.css  # Flexbox/Grid utilities
│   │   │   └── responsive-grid.css   # Breakpoint system
│   │   │
│   │   └── scripts/                  # Common JS libraries
│   │       ├── carousel.js           # Image carousel
│   │       ├── forms.js              # Form validation (Phase 2+)
│   │       └── navigation.js         # Mobile nav toggle
│   │
│   ├── _docs/                        # System documentation
│   │   ├── overview.md
│   │   ├── content_patterns_spec.md
│   │   ├── multi-project-structure.md  # THIS DOCUMENT
│   │   ├── template_guide.md
│   │   ├── api_reference.md
│   │   └── migration_guide.md
│   │
│   └── _logs/                        # System-wide build logs
│       ├── 2025-12-22.log
│       └── build-history.json
│
├── _projects/                        # All website projects
│   │
│   ├── inpowersuite/                 # Example Project 1
│   │   │
│   │   ├── project_config.json       # Project metadata + settings
│   │   │
│   │   ├── site/                     # Site configuration
│   │   │   ├── site_config.json      # Site identity, branding, SEO
│   │   │   ├── _menu.json            # Navigation structure
│   │   │   ├── _layouts.json         # Section layout definitions
│   │   │   ├── _page-templates.json  # Page pattern definitions
│   │   │   ├── _header-layouts.json  # Header style definitions
│   │   │   └── _navigation-layouts.json  # Nav pattern definitions
│   │   │
│   │   ├── src/                      # Content source files
│   │   │   │
│   │   │   ├── en/                   # English content
│   │   │   │   ├── hub00/            # Home hub
│   │   │   │   │   ├── home.page.json
│   │   │   │   │   ├── home.content.json
│   │   │   │   │   ├── services.page.json
│   │   │   │   │   ├── services.content.json
│   │   │   │   │   ├── contact.page.json
│   │   │   │   │   └── contact.content.json
│   │   │   │   │
│   │   │   │   ├── hub01/            # Markets hub
│   │   │   │   │   └── (page files)
│   │   │   │   │
│   │   │   │   └── hub02/            # Features hub
│   │   │   │       └── (page files)
│   │   │   │
│   │   │   ├── es/                   # Spanish content
│   │   │   │   └── (same hub structure)
│   │   │   │
│   │   │   └── fr/                   # French content
│   │   │       └── (same hub structure)
│   │   │
│   │   ├── assets/                   # Project-specific media
│   │   │   ├── images/
│   │   │   │   ├── logo.png
│   │   │   │   ├── hero-banner.jpg
│   │   │   │   └── product-shots/
│   │   │   │
│   │   │   ├── videos/
│   │   │   │   └── demo.mp4
│   │   │   │
│   │   │   └── documents/
│   │   │       └── brochure.pdf
│   │   │
│   │   ├── styles/                   # Project-specific CSS
│   │   │   ├── theme.css             # Brand colors, fonts
│   │   │   ├── content.css           # Content overrides
│   │   │   ├── layout.css            # Layout customizations
│   │   │   └── responsive.css        # Breakpoint adjustments
│   │   │
│   │   ├── scripts/                  # Project-specific JS
│   │   │   └── custom.js             # Custom interactions
│   │   │
│   │   └── _dist/                    # STABLE/LIVE build output
│   │       ├── index.html
│   │       ├── pages/
│   │       │   ├── services.html
│   │       │   └── contact.html
│   │       ├── assets/
│   │       │   └── (copied from project + shared)
│   │       ├── styles/
│   │       │   └── (compiled CSS)
│   │       └── scripts/
│   │           └── (compiled JS)
│   │
│   ├── client-abc/                   # Example Project 2
│   │   └── (same structure as above)
│   │
│   └── client-xyz/                   # Example Project 3
│       └── (same structure as above)
│
├── _output/                          # Latest builds (staging/testing)
│   │
│   ├── inpowersuite/
│   │   ├── build-20251222-143022/    # Timestamped build
│   │   │   ├── index.html
│   │   │   ├── pages/
│   │   │   ├── assets/
│   │   │   ├── styles/
│   │   │   └── scripts/
│   │   │
│   │   ├── build-20251222-091543/    # Previous build
│   │   │   └── (same structure)
│   │   │
│   │   └── latest/                   # Symlink to most recent build
│   │       └── (symlink -> build-20251222-143022/)
│   │
│   ├── client-abc/
│   │   └── (same structure)
│   │
│   └── client-xyz/
│       └── (same structure)
│
├── package.json                      # Node.js dependencies
├── package-lock.json
└── .gitignore
```

## 4. Configuration Schemas

### 4.1 System Configuration

File: _system/_buildr/system_config.json
Purpose: System-wide settings that apply to all projects

Schema:

```
{
  "version": "string",
  "systemName": "string",
  "description": "string",
  
  "paths": {
    "projectsRoot": "string",
    "templatesRoot": "string",
    "sharedRoot": "string",
    "outputRoot": "string",
    "logsRoot": "string"
  },
  
  "templates": {
    "defaultVersion": "string",
    "latestVersion": "string",
    "supportedVersions": ["string"],
    "autoUpgrade": "boolean",
    "allowProjectOverride": "boolean"
  },
  
  "languages": {
    "default": "string",
    "supported": ["string"]
  },
  
  "build": {
    "defaultMode": "string",
    "modes": ["string"],
    "outputFormat": "string",
    "minifyHTML": "boolean",
    "prettyPrint": "boolean",
    "generateSourceMaps": "boolean",
    "multiProjectBuildMode": "string",
    "maxConcurrentBuilds": "number"
  },
  
  "output": {
    "keepDistStable": "boolean",
    "timestampedBuilds": "boolean",
    "maxBuildsToKeep": "number",
    "createSymlinkToLatest": "boolean"
  },
  
  "logging": {
    "level": "string",
    "showTimestamps": "boolean",
    "colorize": "boolean",
    "logToFile": "boolean",
    "rotateDaily": "boolean"
  },
  
  "features": {
    "elementBasedPatterns": "boolean",
    "carouselSupport": "boolean",
    "formValidation": "boolean",
    "multiLanguage": "boolean",
    "versionedTemplates": "boolean"
  }
}
```

Key Fields:

- multiProjectBuildMode: "sequential" (Phase 1) or "parallel" (Phase 2+)
- maxBuildsToKeep: Number of timestamped builds to retain per project
- allowProjectOverride: Whether projects can override system defaults


### 4.2 Project Configuration
File: _projects/{project-id}/project_config.json
Purpose: Project-specific metadata, settings, and deployment configuration

Schema:
```
{
  "projectId": "string",
  "projectName": "string",
  "clientName": "string",
  "status": "string",
  "createdDate": "ISO-8601 date",
  "lastModified": "ISO-8601 datetime",
  "lastBuilt": "ISO-8601 datetime",
  
  "template": {
    "version": "string",
    "autoUpgrade": "boolean",
    "upgradePolicy": "string"
  },
  
  "languages": {
    "default": "string",
    "supported": ["string"],
    "fallback": "string"
  },
  
  "paths": {
    "site": "string",
    "src": "string",
    "assets": "string",
    "styles": "string",
    "scripts": "string",
    "dist": "string",
    "output": "string"
  },
  
  "build": {
    "mode": "string",
    "cleanBeforeBuild": "boolean",
    "copyAssets": "boolean",
    "minifyHTML": "boolean",
    "prettyPrint": "boolean",
    "useSharedStyles": "boolean",
    "useSharedScripts": "boolean",
    "useSharedAssets": "boolean",
    "outputToTimestampedFolder": "boolean",
    "promoteToDist": "boolean"
  },
  
  "deployment": {
    "environments": {
      "staging": {
        "url": "string",
        "s3Bucket": "string",
        "cloudFrontDistribution": "string",
        "deployOnBuild": "boolean"
      },
      "production": {
        "url": "string",
        "s3Bucket": "string",
        "cloudFrontDistribution": "string",
        "deployOnBuild": "boolean",
        "requireApproval": "boolean"
      }
    },
    "cdn": {
      "enabled": "boolean",
      "provider": "string",
      "customDomain": "string",
      "cacheTTL": "number"
    }
  },
  
  "users": [
    {
      "userId": "string",
      "username": "string",
      "role": "string",
      "passwordHash": "string",
      "permissions": ["string"],
      "lastLogin": "ISO-8601 datetime"
    }
  ],
  
  "monitoring": {
    "analyticsEnabled": "boolean",
    "trackingId": "string",
    "errorReporting": "boolean",
    "performanceMonitoring": "boolean"
  },
  
  "backup": {
    "enabled": "boolean",
    "frequency": "string",
    "retention": "number",
    "lastBackup": "ISO-8601 datetime"
  },
  
  "metadata": {
    "tags": ["string"],
    "industry": "string",
    "tier": "string",
    "billingId": "string"
  }
}
```

**Key Fields**:
- `status`: "active", "archived", "suspended"
- `template.upgradePolicy`: "manual", "auto", "locked"
- `build.promoteToDist`: Whether to automatically copy to `_dist/` after successful build
- `deployment.environments`: Separate configurations for staging and production

---

### 4.3 Site Configuration
**File**: `_projects/{project-id}/site/site_config.json`

**Purpose**: Website identity, branding, SEO, and content settings (unchanged from current structure)

**Key Sections**:
- Site identity (ID, name, URL)
- Theme settings (colors, fonts)
- Branding (logos, tagline)
- SEO defaults
- Analytics
- Contact information
- Footer configuration
- Language settings

---

## 5. Template Versioning Strategy

### 5.1 Version Naming Convention

**Format**: `v{MAJOR}.{MINOR}`
- **MAJOR**: Breaking changes, incompatible with previous versions
- **MINOR**: New features, backward-compatible

**Examples**:
- `v1.0` - Initial template release
- `v1.1` - Added new patterns, improved existing ones
- `v2.0` - Complete redesign, new rendering engine

### 5.2 Template Directory Structure
```
_system/_templates/
├── v1.0/
│   ├── partials/
│   ├── layouts/
│   ├── CHANGELOG.md
│   └── README.md
│
├── v1.1/
│   ├── partials/
│   ├── layouts/
│   ├── CHANGELOG.md
│   └── README.md
│
└── v2.0/
    ├── partials/
    ├── layouts/
    ├── CHANGELOG.md
    └── README.md
```

5.3 Upgrade Policies
Projects can specify one of three upgrade policies:

1. Manual (Default)
json{
  "template": {
    "version": "v1.0",
    "upgradePolicy": "manual"
  }
}


- Project stays on specified version
- Administrator must manually update version number
- Safe, predictable, no surprises

2. Auto
```
{
  "template": {
    "version": "v1.0",
    "upgradePolicy": "auto"
  }
}
```
- Project automatically uses system's latestVersion
- Build system checks for newer version at build time
- Inherits new features and improvements
- Risk: Potential breaking changes if MAJOR version changes

3. Locked

```
{
  "template": {
    "version": "v1.0",
    "upgradePolicy": "locked"
  }
}
```
- Project permanently locked to specified version
- Cannot be upgraded even by administrator
- Used for archived projects or special cases

### 5.4 Version Resolution Logic

**At Build Time**:
1. Read `project_config.json`
2. Check `template.upgradePolicy`
3. If "manual" or "locked": Use `template.version`
4. If "auto": Use `system_config.json` → `templates.latestVersion`
5. Verify version exists in `_system/_templates/`
6. Load templates from resolved version directory

---

## 6. Build Output Strategy

### 6.1 Dual Output Philosophy

**Problem**: How to balance testing/validation with production stability?

**Solution**: Two separate output destinations with different purposes

### 6.2 Output Directory (`_output/`)

**Purpose**: Testing, validation, staging

**Characteristics**:
- Timestamped builds: `build-YYYYMMDD-HHMMSS/`
- Automatic generation on every build
- Retention policy: Keep last N builds (configurable)
- Symlink `latest/` points to most recent
- Easy rollback to previous builds
- Can be tested before promotion

**Structure**:
```
_output/
└── {project-id}/
    ├── build-20251222-143022/
    ├── build-20251222-091543/
    ├── build-20251221-160412/
    └── latest/  → (symlink to build-20251222-143022/)
```

**Benefits**:
- Build history preservation
- Safe testing environment
- Easy comparison between builds
- Rollback capability

### 6.3 Distribution Directory (`_dist/`)

**Purpose**: Stable, production-ready output

**Characteristics**:
- Lives inside project directory
- Only updated via explicit "promotion"
- Represents "last known good" state
- Source for production deployments
- Not automatically overwritten

**Location**: `_projects/{project-id}/_dist/`

**Promotion Trigger**:
- Manual: `--promote-to-dist` flag
- Automatic: `build.promoteToDist: true` in config
- After validation of `_output/` build

**Benefits**:
- Production stability
- Clear separation of testing vs. live
- Prevents accidental deployment of broken builds

### 6.4 Build Workflow
```
┌─────────────────┐
│  Trigger Build  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Build to _output/  │
│  (timestamped)      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Create 'latest'    │
│  symlink            │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Test & Validate    │
└────────┬────────────┘
         │
         ▼
    ┌────────┐
    │ Valid? │
    └───┬────┘
        │
    ┌───┴───┐
    │       │
    NO     YES
    │       │
    │       ▼
    │  ┌─────────────────────┐
    │  │ Promote to _dist/   │
    │  │ (manual or auto)    │
    │  └─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Fix & Rebuild      │
└─────────────────────┘
```

### 6.5 Cleanup Strategy

**Automatic Cleanup**:
- Triggered after each successful build
- Keeps only last N builds (default: 10)
- Deletes oldest timestamped directories
- Never deletes `_dist/` or `latest/` symlink

**Manual Cleanup**:
- CLI command: `npm run clean -- --project={id}`
- Removes all `_output/` builds for project
- Optionally removes `_dist/` (with confirmation)

---

## 7. Shared Resources Management

### 7.1 Shared Assets (`_system/_shared/assets/`)

**Purpose**: Universal images and icons used across multiple projects

**Contents**:
- Common UI icons (checkmarks, arrows, bullets)
- Placeholder images
- System branding (Webly logo)
- Default hero images

**Usage**:
- Referenced in templates via relative path
- Copied to project `_dist/assets/shared/` during build
- Can be overridden by project-specific assets

**Example Structure**:
```
_system/_shared/assets/
├── icons/
│   ├── checkmark.svg
│   ├── arrow-right.svg
│   ├── bullet.svg
│   └── close.svg
│
└── system/
    ├── webly-logo.png
    ├── placeholder-image.png
    └── default-hero.jpg
```

### 7.2 Shared Styles (`_system/_shared/styles/`)

**Purpose**: Base CSS framework providing common utilities

**Contents**:
- CSS reset/normalize
- Typography system
- Layout utilities (flexbox, grid)
- Responsive breakpoints

**Usage**:
- Optionally included via `build.useSharedStyles: true`
- Loaded before project-specific styles
- Provides consistent foundation
- Can be overridden by project CSS

**Example Structure**:
```
_system/_shared/styles/
├── reset.css
├── typography.css
├── layout-utilities.css
└── responsive-grid.css
```

### 7.3 Shared Scripts (`_system/_shared/scripts/`)

**Purpose**: Common JavaScript functionality

**Contents**:
- Carousel/slider logic
- Form validation (Phase 2+)
- Mobile navigation toggle
- Accessibility utilities

**Usage**:
- Optionally included via `build.useSharedScripts: true`
- Loaded before project-specific scripts
- Provides baseline interactivity

**Example Structure**:
```
_system/_shared/scripts/
├── carousel.js
├── forms.js
└── navigation.js
```

---

## 8. Project Isolation & Independence

### 8.1 Isolation Principles

Each project must be:
1. **Self-contained**: All project-specific resources within project directory
2. **Independent**: Changes to one project don't affect others
3. **Portable**: Can be moved, archived, or deleted without system impact
4. **Reproducible**: Can be rebuilt from source files alone

### 8.2 Project Boundary Enforcement

**Inside Project Directory**:
- Configuration (`site/`, `project_config.json`)
- Content (`src/`)
- Assets (`assets/`)
- Custom styles/scripts
- Build output (`_dist/`)

**Outside Project Directory**:
- Build tools (`_system/_buildr/`)
- Templates (`_system/_templates/`)
- Shared resources (`_system/_shared/`)
- Build history (`_output/`)
- System logs (`_system/_logs/`)

**Rule**: Projects NEVER reference resources from other projects

### 8.3 Cross-Project Contamination Prevention

**File Paths**:
- All paths in build system are project-scoped
- No hardcoded absolute paths
- Dynamic path resolution based on `projectId`

**Asset Namespacing**:
- Assets copied to project-specific output
- No shared asset directories in output
- Each project has isolated `/assets/` in `_dist/`

**Build Process**:
- Each project builds independently
- Shared build system, isolated execution
- No shared state between builds

---

## 9. Migration from Current Structure

### 9.1 Current Structure (Single Project)
```
PROJECT_ROOT/
├── _buildr/
├── _templates/
├── _docs/
├── site/
├── src/
├── assets/
├── styles/
├── scripts/
└── _dist/
```

### 9.2 Migration Strategy

**Phase 1: Create New Structure**
1. Create `_system/` directory
2. Create `_projects/` directory
3. Create `_output/` directory
4. Move system resources to `_system/`
5. Version templates: `_system/_templates/v1.0/`

**Phase 2: Convert Existing Project**
1. Create `_projects/inpowersuite/`
2. Move project files into project directory
3. Create `project_config.json`
4. Update paths in configuration files

**Phase 3: Update Build System**
1. Modify build scripts to accept `--project` parameter
2. Update path resolution logic
3. Implement template version resolution
4. Implement dual output (` _output/` + `_dist/`)

**Phase 4: Test & Validate**
1. Build converted project
2. Compare output with original
3. Verify all assets copied correctly
4. Test watch mode

**Phase 5: Create Second Project**
1. Use CLI to create new project
2. Configure and populate content
3. Build and validate
4. Verify no cross-contamination

### 9.3 Migration Checklist

- [ ] Create new directory structure
- [ ] Move `_buildr/` → `_system/_buildr/`
- [ ] Move `_templates/` → `_system/_templates/v1.0/`
- [ ] Move `_docs/` → `_system/_docs/`
- [ ] Create `_system/_shared/`
- [ ] Create `_projects/inpowersuite/`
- [ ] Move `site/` into project
- [ ] Move `src/` into project
- [ ] Move `assets/` into project
- [ ] Move `styles/` into project
- [ ] Move `scripts/` into project
- [ ] Move `_dist/` into project
- [ ] Create `project_config.json`
- [ ] Create `system_config.json`
- [ ] Update build scripts
- [ ] Test build process
- [ ] Validate output
- [ ] Document changes

---

## 10. Build System Requirements

### 10.1 Generator Requirements

**Must Support**:
- Project-based execution: `--project={id}`
- Template version resolution
- Dynamic path configuration
- Timestamped output generation
- Promotion to `_dist/`
- Old build cleanup
- Dependency graph per project
- Full and incremental builds

**Must NOT**:
- Hardcode project paths
- Assume single project
- Mix project states
- Share caches between projects

### 10.2 CLI Requirements

**Project Management Commands**:
```
project:list          # List all projects
project:info          # Show project details
project:create        # Create new project
project:clone         # Clone existing project
project:archive       # Archive project
```

**Build Commands**:
```
build                 # Build specific project
build:all             # Build all active projects (sequential)
build:promote         # Build and promote to _dist
```

**Template Commands**:
```
template:list         # Show available versions
template:upgrade      # Upgrade project template version
```

**Maintenance Commands**:
```
clean                 # Clean project output
clean:all             # Clean all outputs
```

10.3 Watcher Requirements
Must Support:

- Project-specific watching: --project={id}
- File change detection within project
- Incremental builds
- Browser-sync with project-specific port
- Live reload

Must NOT:

- Watch multiple projects simultaneously (Phase 1)
- Trigger builds for other projects
- Share browser-sync instances


## 11. Phase-Specific Implementation Notes

### 11.1 Phase 1 (Current - File-Based)
Priorities:

1. Implement multi-project file structure
2. Update build system for project-awareness
3. Implement template versioning
4. Implement dual output (_output/ + _dist/)
5. Create CLI tools for project management
6. Sequential multi-project builds

Deferred:

- Parallel builds (Phase 2)
- Database integration (Phase 2)
- Web UI (Phase 2)
- Advanced deployment automation (Phase 2)

### 11.2 Phase 2 (Database-Driven)

Enhancements:

- Store project_config.json in database
- Store user credentials in database
- Parallel project builds (multiProjectBuildMode: "parallel")
- Web-based project management UI
- Content versioning and workflow

File Structure:

- Maintain same directory structure
- Configuration migrates to database
- Content may migrate to database
- Templates remain file-based

### 11.3 Phase 3 (APEX-Integrated)
Enhancements:

- APEX UI for all project management
- Advanced user management
- Audit logging
- Approval workflows

File Structure:

- Likely unchanged
- Build system may become hybrid (APEX + Node.js)


## 12. Design Decisions Summary

### 12.1 Key Decisions Made
DecisionOptions ConsideredChoiceRationaleTemplate LocationPer-project vs System-levelSystem-level versionedSingle source of truth, easier maintenanceUpgrade PolicyAuto vs ManualParameter-driven (project decides)Flexibility for different project needsShared AssetsNone vs System-levelSystem-level _shared/assets/Reduce duplication, consistent iconsBuild OutputSingle location vs DualDual (_output/ + _dist/)Safety (testing) + Stability (production)Multi-Build ModeParallel vs SequentialSequential (Phase 1), Parallel (Phase 2)Simplicity first, performance laterProject MetadataMinimal vs ComprehensiveComprehensiveSupport deployment, monitoring, backup

### 12.2 Resolved Questions

1. Template Versioning: Projects can choose upgrade policy (manual/auto/locked)
2. Shared Assets: Yes, in _system/_shared/assets/
3. Build Output: Both _dist/ (stable) and _output/{project}/ (latest builds)
4. Project Metadata: Enhanced with deployment URLs, CDN, monitoring, backup
5. Multi-Project Builds: Sequential (Phase 1), parallel (Phase 2)

ulti-Project Builds: Sequential (Phase 1), parallel (Phase 2)


## 13. Success Criteria
This design will be considered successful when:

1. Multiple projects can coexist without conflicts
2. Projects are completely isolated (changes don't affect others)
3. Templates are shared efficiently (single source, versioned)
4. Build output is predictable (testing vs. production separation)
5. System is maintainable (clear structure, good documentation)
6. Migration is straightforward (existing project converts cleanly)
7. Extensibility is preserved (can add new projects easily)
8. Phase 2/3 migration is possible (structure supports database integration)


## 14. Next Steps
### 14.1 Immediate Actions

1. Review and approve this design document
2. Create migration plan document with step-by-step instructions
3. Design implementation plans for:

-- Build system refactoring
-- CLI tool development
-- Template versioning system
-- Output management logic



## 14.2 Future Design Documents Needed

- WEBLY-DESIGN-004: Build System Architecture (generator, renderer, CLI)
- WEBLY-DESIGN-005: Template Versioning Implementation Guide
- WEBLY-DESIGN-006: Project Management Module Design
- WEBLY-DESIGN-007: Content Editor Module Design
- WEBLY-DESIGN-008: Deployment System Architecture


** 15. Appendices
Appendix A: Glossary

- Project: A single website managed by Webly
- Hub: Top-level content grouping within a site (hub00, hub01, etc.)
- Template Version: Specific release of the template library (v1.0, v1.1, etc.)
- Promotion: Process of copying from _output/ to _dist/
- Build: Process of generating static HTML from source files
- Timestamped Build: Build output labeled with creation timestamp

Appendix B: File Naming Conventions

- Project ID: Lowercase, hyphens only (e.g., inpowersuite, client-abc)
- Config Files: Lowercase with underscores (e.g., project_config.json)
- Template Files: Lowercase with underscores, .hbs extension
- Content Files: {pageId}.{type}.json (e.g., home.content.json)
- Build Folders: build-YYYYMMDD-HHMMSS (e.g., build-20251222-143022)

Appendix C: Path Resolution Examples

System Paths (Fixed):
```
_system/_buildr/generator.js
_system/_templates/v1.0/layouts/split_layout.hbs
_system/_shared/assets/icons/checkmark.svg
```

Project Paths (Dynamic based on projectId):
```
_projects/{projectId}/project_config.json
_projects/{projectId}/site/site_config.json
_projects/{projectId}/src/en/hub00/home.content.json
_projects/{projectId}/assets/images/logo.png
_projects/{projectId}/_dist/index.html
```

Output Paths (Dynamic based on projectId and timestamp):
```
_output/{projectId}/build-{timestamp}/index.html
_output/{projectId}/latest/index.html
```

Document Approval
RoleNameDateStatusTechnical Lead[TBD]2025-12-22Pending ReviewProject Owner[TBD]2025-12-22Pending ReviewDeveloper[TBD]2025-12-22Pending Review

Change History
VersionDateAuthorChanges1.02025-12-22Design TeamInitial version - Multi-project file structure design

END OF DOCUMENT
