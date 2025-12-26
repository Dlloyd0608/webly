# Continuity Brief: Create cli.js for Multi-Project Management

## Document Information
- **Brief ID**: WEBLY-IMPL-004
- **Component**: cli.js (NEW FILE)
- **Task**: Create command-line interface for project management
- **Complexity**: Medium (New Development)
- **Priority**: Fourth implementation (after core build scripts)
- **Estimated Effort**: 3-4 hours
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
  - ✅ generator.js refactored (WEBLY-IMPL-003)
- **Current Task**: Create CLI tool for project management

### Why cli.js Fourth?
- NEW file creation (no refactoring needed)
- Depends on refactored core scripts
- Provides user-facing commands for multi-project operations
- Independent from build process (can be developed in parallel)
- Quality-of-life tool for administrators

---

## Purpose & Scope

### What is cli.js?
A command-line utility that provides convenient commands for:
- **Project Discovery**: List and inspect projects
- **Project Management**: Create, clone, archive projects
- **Template Management**: List versions, upgrade projects
- **Maintenance**: Clean output directories, manage builds

### What cli.js is NOT
- ❌ Not a replacement for build scripts
- ❌ Not involved in actual page rendering
- ❌ Not a web interface (that's Phase 2)
- ❌ Not required for builds (optional convenience tool)

---

## File Location & Structure

### Location
**New File**: `_system/_buildr/cli.js`

### File Type
Node.js executable script with shebang:
```javascript
#!/usr/bin/env node
```

### Module Structure
```javascript
// cli.js structure
const fs = require('fs');
const path = require('path');

// Command implementations
const commands = {
  list: listProjects,
  info: showProjectInfo,
  create: createProject,
  clone: cloneProject,
  archive: archiveProject,
  'list-templates': listTemplates,
  'upgrade-template': upgradeTemplate,
  clean: cleanProject,
  'clean-all': cleanAllProjects
};

// Helper functions
function parseArgs() { /* ... */ }
function loadSystemConfig() { /* ... */ }
function loadProjectConfig(projectId) { /* ... */ }

// Command execution
const command = process.argv[2];
if (commands[command]) {
  commands[command]();
} else {
  showHelp();
}
```

---

## Required Commands

### 1. `list` - List All Projects

#### Command
```bash
node _system/_buildr/cli.js list
```

#### Purpose
Display all projects with key information

#### Output Format
```
📁 Webly Projects:

  ips-v1
    Name: inPowerSuite Website v1
    Status: active
    Template: v1.0
    Last Built: 2025-12-25T14:30:22Z
    Path: _projects/ips/v1/

  client-abc
    Name: Client ABC Website
    Status: active
    Template: v1.0
    Last Built: 2025-12-20T09:15:00Z
    Path: _projects/client-abc/

Total: 2 projects (2 active, 0 archived)
```

#### Implementation Requirements
- Scan `_projects/` directory recursively
- Find all `project_config.json` files
- Parse and display key fields
- Group by status (active, archived, suspended)
- Sort alphabetically by projectId

---

### 2. `info` - Show Project Details

#### Command
```bash
node _system/_buildr/cli.js info --project=ips-v1
```

#### Purpose
Display detailed information about a specific project

#### Output Format
```
📋 Project Information

Project ID:       ips-v1
Project Name:     inPowerSuite Website v1
Client Name:      Niche Group, Inc.
Status:           active
Created:          2025-01-15
Last Modified:    2025-12-25T14:30:22Z
Last Built:       2025-12-25T14:30:22Z

Template:
  Version:        v1.0
  Upgrade Policy: manual
  Auto Upgrade:   false

Languages:
  Default:        en
  Supported:      en, es, fr

Paths:
  Project:        _projects/ips/v1/
  Output:         _output/ips-v1/
  Dist:           _projects/ips/v1/_dist/

Build Settings:
  Mode:           development
  Use Shared:     styles=true, scripts=true, assets=true
  Promote:        false
  Timestamped:    true

Deployment:
  Staging:        https://staging.inpowersuite.com
  Production:     https://www.inpowersuite.com

Users:
  - admin (administrator)
  - content_01 (contributor)

Recent Builds:
  1. build-20251225-143022 (latest)
  2. build-20251225-091543
  3. build-20251224-160412
```

#### Implementation Requirements
- Load project_config.json
- Format and display all sections
- List recent builds from _output directory
- Show deployment URLs
- Display user list (without passwords)

---

### 3. `create` - Create New Project

#### Command
```bash
node _system/_buildr/cli.js create --id=client-new --name="New Client Website"
```

#### Optional Parameters
```bash
--template=v1.0        # Template version (default: system default)
--lang=en              # Default language (default: en)
--status=active        # Project status (default: active)
```

#### Purpose
Create a new project with complete directory structure and configuration

#### Process
1. Validate project ID (lowercase, hyphens only)
2. Check if project already exists
3. Create directory structure
4. Generate `project_config.json`
5. Create placeholder site configurations
6. Create sample content (optional)
7. Initialize _dist directory

#### Output
```
Creating new project: client-new

✓ Created directory: _projects/client-new/
✓ Created directory: _projects/client-new/site/
✓ Created directory: _projects/client-new/src/en/hub00/
✓ Created directory: _projects/client-new/assets/images/
✓ Created directory: _projects/client-new/styles/
✓ Created directory: _projects/client-new/scripts/
✓ Created directory: _projects/client-new/_dist/
✓ Created project_config.json
✓ Created site_config.json (template)
✓ Created _menu.json (template)

Project 'client-new' created successfully!

Next steps:
  1. Edit configuration: _projects/client-new/project_config.json
  2. Configure site: _projects/client-new/site/site_config.json
  3. Add content to: _projects/client-new/src/en/hub00/
  4. Build project: npm run build -- --project=client-new
```

#### Implementation Requirements
- Validate project ID format
- Create complete directory structure
- Generate project_config.json with defaults
- Create minimal site configuration templates
- Add README.md to project directory
- Handle errors gracefully

---

### 4. `clone` - Clone Existing Project

#### Command
```bash
node _system/_buildr/cli.js clone --source=ips-v1 --target=ips-v2
```

#### Optional Parameters
```bash
--name="inPowerSuite Website v2"  # New project name
```

#### Purpose
Duplicate an existing project as starting point for new project

#### Process
1. Validate source project exists
2. Validate target doesn't exist
3. Copy entire project directory
4. Update project_config.json (new ID, name, dates)
5. Clear build timestamps
6. Clear _dist directory

#### Output
```
Cloning project: ips-v1 → ips-v2

✓ Copied project directory
✓ Updated project_config.json
  - Project ID: ips-v2
  - Project Name: inPowerSuite Website v2
  - Created: 2025-12-25
  - Cleared build history
✓ Cleared _dist directory

Project 'ips-v2' created from 'ips-v1'!

Next steps:
  1. Review configuration: _projects/ips/v2/project_config.json
  2. Update content as needed
  3. Build project: npm run build -- --project=ips-v2
```

#### Implementation Requirements
- Validate source and target
- Deep copy directory (recursive)
- Update project_config.json fields
- Reset timestamps
- Empty _dist directory
- Preserve content and configuration

---

### 5. `archive` - Archive Project

#### Command
```bash
node _system/_buildr/cli.js archive --project=old-client
```

#### Optional Parameters
```bash
--confirm=yes   # Skip confirmation prompt
```

#### Purpose
Mark project as archived (change status, don't delete)

#### Process
1. Load project_config.json
2. Confirm action with user
3. Update status to "archived"
4. Lock template version (upgradePolicy = "locked")
5. Save updated config

#### Output
```
Archive project: old-client

This will:
  - Change status to "archived"
  - Lock template version
  - Project will not appear in active lists
  - Files will be preserved

Proceed? (yes/no): yes

✓ Updated project status to "archived"
✓ Locked template version at v1.0
✓ Project configuration saved

Project 'old-client' has been archived.
Files preserved at: _projects/old-client/
```

#### Implementation Requirements
- Load project_config.json
- Prompt for confirmation (unless --confirm=yes)
- Update status field
- Set upgradePolicy to "locked"
- Save configuration
- Do NOT delete files

---

### 6. `list-templates` - List Template Versions

#### Command
```bash
node _system/_buildr/cli.js list-templates
```

#### Purpose
Show all available template versions and which projects use them

#### Output Format
```
📦 Template Versions:

Available Versions:
  v1.0 (2 projects)
    - ips-v1 (manual)
    - client-abc (locked)
  
  v1.1 (latest) (1 project)
    - client-new (auto)

System Default: v1.0
Latest Version: v1.1

Template Directory: _system/_templates/
```

#### Implementation Requirements
- Scan `_system/_templates/` directory
- List all version directories
- Scan all projects to find which use each version
- Show upgrade policy for each project
- Indicate system default and latest

---

### 7. `upgrade-template` - Upgrade Project Template

#### Command
```bash
node _system/_buildr/cli.js upgrade-template --project=ips-v1 --version=v1.1
```

#### Optional Parameters
```bash
--policy=manual    # Set upgrade policy (manual, auto, locked)
```

#### Purpose
Change the template version used by a project

#### Process
1. Load project_config.json
2. Validate target template version exists
3. Check if project is locked
4. Update template.version
5. Optionally update upgradePolicy
6. Save configuration
7. Recommend rebuild

#### Output
```
Upgrading template for: ips-v1

Current: v1.0 (manual)
Target:  v1.1 (manual)

✓ Template version updated to v1.1
✓ Upgrade policy: manual

Project configuration saved.

⚠️  IMPORTANT: Rebuild required to use new templates
    Run: npm run build -- --project=ips-v1 --full-rebuild
```

#### Implementation Requirements
- Validate version exists
- Check template directory exists
- Handle locked projects (error)
- Update project_config.json
- Warn about rebuild requirement
- Optionally update upgrade policy

---

### 8. `clean` - Clean Project Output

#### Command
```bash
node _system/_buildr/cli.js clean --project=ips-v1
```

#### Optional Parameters
```bash
--dist          # Also clean _dist directory
--confirm=yes   # Skip confirmation
```

#### Purpose
Remove build output for a project

#### Process
1. Remove all builds from `_output/{projectId}/`
2. Optionally remove `_projects/{projectId}/_dist/` (if --dist flag)
3. Confirm before deletion

#### Output
```
Clean output for: ips-v1

This will remove:
  - _output/ips-v1/ (all builds)
  - Symlink: _output/ips-v1/latest/

Proceed? (yes/no): yes

✓ Removed 5 builds from _output/ips-v1/
✓ Removed symlink: _output/ips-v1/latest/
✓ Removed directory: _output/ips-v1/

Output cleaned for 'ips-v1'
```

#### With `--dist` flag:
```
This will remove:
  - _output/ips-v1/ (all builds)
  - _projects/ips/v1/_dist/ (stable build)

⚠️  WARNING: This will delete the stable production build!

Proceed? (yes/no): 
```

#### Implementation Requirements
- Validate project exists
- Prompt for confirmation
- Remove _output directory recursively
- Optionally remove _dist (with extra warning)
- Handle missing directories gracefully

---

### 9. `clean-all` - Clean All Projects

#### Command
```bash
node _system/_buildr/cli.js clean-all
```

#### Optional Parameters
```bash
--confirm=yes   # Skip confirmation
```

#### Purpose
Remove all build output for all projects

#### Process
1. Scan `_output/` directory
2. List all projects to be cleaned
3. Confirm action
4. Remove all project output directories

#### Output
```
Clean output for ALL projects

This will remove builds for:
  - ips-v1 (5 builds)
  - client-abc (3 builds)

Total: 8 builds

Proceed? (yes/no): yes

✓ Cleaned: ips-v1 (5 builds removed)
✓ Cleaned: client-abc (3 builds removed)

All project outputs cleaned.
```

#### Implementation Requirements
- Scan _output directory
- List all projects with build counts
- Confirm with user
- Remove each project's output
- Summary report

---

## Helper Functions

### Parse Command Line Arguments
```javascript
function parseArgs() {
  const args = {};
  
  process.argv.slice(3).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value || true;
    }
  });
  
  return args;
}
```

### Load System Configuration
```javascript
function loadSystemConfig() {
  const configPath = path.join(__dirname, 'system_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('ERROR: system_config.json not found');
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
```

### Load Project Configuration
```javascript
function loadProjectConfig(projectId) {
  const systemConfig = loadSystemConfig();
  const projectPath = resolveProjectPath(projectId, systemConfig);
  const configPath = path.join(projectPath, 'project_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`ERROR: Project '${projectId}' not found`);
    console.error(`Expected: ${configPath}`);
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
```

### Resolve Project Path
```javascript
function resolveProjectPath(projectId, systemConfig) {
  const projectsRoot = systemConfig.paths.projectsRoot;
  
  // Handle versioned format (e.g., "ips-v1")
  const match = projectId.match(/^(.+)-v(\d+)$/);
  if (match) {
    const [, name, version] = match;
    return path.join(projectsRoot, name, `v${version}`);
  }
  
  // Simple format (e.g., "client-abc")
  return path.join(projectsRoot, projectId);
}
```

### Confirm Action
```javascript
function confirm(message) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${message} (yes/no): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}
```

### Format Date
```javascript
function formatDate(isoString) {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  return date.toLocaleString();
}
```

---

## Help Command

### `help` or no arguments
```bash
node _system/_buildr/cli.js
node _system/_buildr/cli.js help
```

#### Output
```
Webly CLI - Multi-Project Management Tool

Usage: node _system/_buildr/cli.js <command> [options]

COMMANDS:

Project Management:
  list                         List all projects
  info --project=<id>         Show project details
  create --id=<id> --name="Name"  Create new project
  clone --source=<id> --target=<id>  Clone existing project
  archive --project=<id>      Archive project

Template Management:
  list-templates              List available template versions
  upgrade-template --project=<id> --version=<ver>  Upgrade project template

Maintenance:
  clean --project=<id>        Clean project output
  clean-all                   Clean all project outputs

OPTIONS:
  --project=<id>              Project ID
  --name="Name"               Project name
  --template=<version>        Template version
  --confirm=yes               Skip confirmation prompts
  --dist                      Include _dist directory (clean command)

EXAMPLES:
  node _system/_buildr/cli.js list
  node _system/_buildr/cli.js info --project=ips-v1
  node _system/_buildr/cli.js create --id=client-new --name="New Client"
  node _system/_buildr/cli.js clean --project=ips-v1

For more information, see: _system/_docs/
```

---

## Error Handling

### Missing Required Parameter
```javascript
if (!args.project) {
  console.error('ERROR: --project parameter required');
  console.error('Usage: cli.js info --project=<id>');
  process.exit(1);
}
```

### Invalid Project ID
```javascript
if (!/^[a-z0-9-]+$/.test(projectId)) {
  console.error('ERROR: Invalid project ID');
  console.error('Project IDs must be lowercase letters, numbers, and hyphens only');
  process.exit(1);
}
```

### Project Already Exists
```javascript
if (fs.existsSync(projectPath)) {
  console.error(`ERROR: Project '${projectId}' already exists`);
  console.error(`Path: ${projectPath}`);
  process.exit(1);
}
```

---

## Testing Requirements

### Test Case 1: List Projects
```bash
node _system/_buildr/cli.js list

Expected:
✓ Shows all projects in _projects/
✓ Displays projectId, name, status, template
✓ Shows total count
✓ Formatted output with icons
```

### Test Case 2: Show Project Info
```bash
node _system/_buildr/cli.js info --project=ips-v1

Expected:
✓ Loads project_config.json
✓ Displays all configuration sections
✓ Lists recent builds
✓ Shows formatted dates
✓ No errors
```

### Test Case 3: Create New Project
```bash
node _system/_buildr/cli.js create --id=test-project --name="Test Project"

Expected:
✓ Creates directory structure
✓ Creates project_config.json
✓ Creates placeholder configs
✓ Success message with next steps
✓ Project can be built immediately
```

### Test Case 4: Clone Project
```bash
node _system/_buildr/cli.js clone --source=ips-v1 --target=ips-v2

Expected:
✓ Copies entire project directory
✓ Updates project_config.json
✓ Clears _dist
✓ New project is independent
```

### Test Case 5: Clean Project
```bash
node _system/_buildr/cli.js clean --project=ips-v1 --confirm=yes

Expected:
✓ Removes _output/ips-v1/
✓ Success message
✓ Does NOT remove _dist (no --dist flag)
```

---

## Integration with package.json

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "project:list": "node _system/_buildr/cli.js list",
    "project:info": "node _system/_buildr/cli.js info",
    "project:create": "node _system/_buildr/cli.js create",
    "project:clone": "node _system/_buildr/cli.js clone",
    "clean": "node _system/_buildr/cli.js clean",
    "clean:all": "node _system/_buildr/cli.js clean-all"
  }
}
```

Usage:
```bash
npm run project:list
npm run project:info -- --project=ips-v1
npm run project:create -- --id=new-client --name="New Client"
npm run clean -- --project=ips-v1
```

---

## Success Criteria

The new `cli.js` will be considered successful when:

1. ✅ All 9 commands implemented
2. ✅ Help text displays correctly
3. ✅ Error handling for all edge cases
4. ✅ User confirmation for destructive actions
5. ✅ Formatted, readable output
6. ✅ Integrates with system_config.json
7. ✅ Integrates with project_config.json
8. ✅ All test cases pass
9. ✅ Can be used via npm scripts
10. ✅ Provides helpful error messages

---

## Files to Reference

When implementing, review these files:

1. **System config**: `_system/_buildr/system_config.json`
2. **Project config template**: `_system/project_config.json`
3. **Existing project config**: `_projects/ips/v1/project_config.json`
4. **generator.js**: `_system/_buildr/generator.js` (for path resolution logic)

---

## Next Steps After cli.js

Once cli.js is complete and tested:

1. ✅ watcher.js refactored (WEBLY-IMPL-001)
2. ✅ renderer.js refactored (WEBLY-IMPL-002)
3. ✅ generator.js refactored (WEBLY-IMPL-003)
4. ✅ cli.js created (WEBLY-IMPL-004)
5. ⏭️ build-all.js creation (new file) - WEBLY-IMPL-005
6. ⏭️ package.json scripts update

---

## Implementation Chat Instructions

**Paste this brief into a new chat and request:**

> "Based on this continuity brief, create cli.js as a new command-line interface tool for Webly multi-project management. Implement all 9 commands with proper error handling, user confirmations, and formatted output. Ensure integration with system and project configurations. Make the tool user-friendly with helpful messages and examples."

---

## Additional Context

- **Design Philosophy**: User-friendly, helpful, safe (confirm destructive actions)
- **Output Style**: Clear, formatted, uses icons/emojis for visual clarity
- **Error Messages**: Specific, actionable, show examples
- **Testing Strategy**: Test each command individually
- **Risk Level**: Low (utility tool, doesn't affect builds)
- **Dependencies**: Reads configs, doesn't execute builds
- **Repository**: https://github.com/Dlloyd0608/webly

---

## File Structure Reference

```
WEBLY_ROOT/
├── _system/
│   ├── _buildr/
│   │   ├── cli.js              ← THIS FILE (to be created)
│   │   ├── system_config.json  ← Used by CLI
│   │   └── ...
│   │
│   └── _templates/
│       ├── v1.0/
│       └── v1.1/
│
├── _projects/
│   ├── ips/
│   │   └── v1/
│   │       └── project_config.json  ← Managed by CLI
│   └── ...
│
└── _output/                    ← Cleaned by CLI
    └── ...
```

---

**END OF BRIEF**
