# Continuity Brief: Create build-all.js for Multi-Project Builds

## Document Information
- **Brief ID**: WEBLY-IMPL-005
- **Component**: build-all.js (NEW FILE)
- **Task**: Create multi-project sequential build orchestrator
- **Complexity**: Low-Medium (New Development)
- **Priority**: Fifth implementation (final build script)
- **Estimated Effort**: 2-3 hours
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
  - ✅ cli.js created (WEBLY-IMPL-004)
- **Current Task**: Create multi-project build orchestrator

### Why build-all.js Last?
- NEW file creation (simple orchestrator)
- Depends on refactored generator.js
- Final piece of Phase 1 build system
- Sequential execution (simple logic)
- Clear, focused responsibility

---

## Purpose & Scope

### What is build-all.js?
A build orchestrator that:
- **Discovers** all projects in `_projects/`
- **Filters** by status (active only)
- **Builds** each project sequentially (Phase 1 requirement)
- **Reports** summary of successes and failures
- **Exits** with appropriate error code

### What build-all.js is NOT
- ❌ Not a parallel build executor (that's Phase 2)
- ❌ Not a project manager (that's cli.js)
- ❌ Not a watcher (that's watcher.js)
- ❌ Not the build engine itself (that's generator.js)

### Phase 1 vs Phase 2 Behavior

**Phase 1 (Current)**:
- Sequential builds (one after another)
- Simple error handling
- Basic progress reporting
- No concurrency

**Phase 2 (Future)**:
- Parallel builds (multiple at once)
- Advanced scheduling
- Resource management
- Configurable concurrency limit

---

## File Location & Structure

### Location
**New File**: `_system/_buildr/build-all.js`

### File Type
Node.js executable script with shebang:
```javascript
#!/usr/bin/env node
```

### Module Structure
```javascript
// build-all.js structure
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MultiProjectBuilder {
  constructor(options = {}) {
    this.options = options;
    this.systemConfig = this.loadSystemConfig();
    this.results = [];
  }
  
  async buildAll() {
    // Discovery → Filter → Build → Report
  }
  
  discoverProjects() { /* ... */ }
  filterProjects(projects) { /* ... */ }
  buildProject(projectId) { /* ... */ }
  generateReport() { /* ... */ }
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const builder = new MultiProjectBuilder(options);
  builder.buildAll();
}

module.exports = MultiProjectBuilder;
```

---

## Core Functionality

### 1. Project Discovery

#### Purpose
Find all projects in the `_projects/` directory

#### Process
```javascript
discoverProjects() {
  const projectsRoot = this.systemConfig.paths.projectsRoot;
  const projects = [];
  
  // Recursively scan for project_config.json files
  const scanDir = (dir, depth = 0) => {
    if (depth > 3) return; // Limit recursion depth
    
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      if (entry.isDirectory()) {
        const subPath = path.join(dir, entry.name);
        const configPath = path.join(subPath, 'project_config.json');
        
        if (fs.existsSync(configPath)) {
          // Found a project
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          projects.push({
            projectId: config.projectId,
            projectName: config.projectName,
            status: config.status || 'active',
            path: subPath,
            config: config
          });
        } else {
          // Continue scanning subdirectories
          scanDir(subPath, depth + 1);
        }
      }
    });
  };
  
  scanDir(projectsRoot);
  
  return projects;
}
```

#### Output Example
```javascript
[
  {
    projectId: 'ips-v1',
    projectName: 'inPowerSuite Website v1',
    status: 'active',
    path: '_projects/ips/v1/',
    config: { /* full config */ }
  },
  {
    projectId: 'client-abc',
    projectName: 'Client ABC Website',
    status: 'active',
    path: '_projects/client-abc/',
    config: { /* full config */ }
  },
  {
    projectId: 'old-site',
    projectName: 'Old Website',
    status: 'archived',
    path: '_projects/old-site/',
    config: { /* full config */ }
  }
]
```

---

### 2. Project Filtering

#### Purpose
Filter projects based on status and options

#### Process
```javascript
filterProjects(projects) {
  let filtered = projects;
  
  // Filter by status (skip archived/suspended unless --all flag)
  if (!this.options.all) {
    filtered = filtered.filter(p => p.status === 'active');
  }
  
  // Filter by specific projects (if --projects flag provided)
  if (this.options.projects) {
    const targetIds = this.options.projects.split(',');
    filtered = filtered.filter(p => targetIds.includes(p.projectId));
  }
  
  // Sort alphabetically by projectId
  filtered.sort((a, b) => a.projectId.localeCompare(b.projectId));
  
  return filtered;
}
```

#### Filtering Options
- **Default**: Only `active` projects
- **`--all`**: Include archived and suspended projects
- **`--projects=id1,id2`**: Build only specified projects

---

### 3. Sequential Build Execution

#### Purpose
Build each project one at a time (Phase 1 requirement)

#### Process
```javascript
async buildAll() {
  console.log('[Build-All] Starting sequential build of all projects...\n');
  
  const startTime = Date.now();
  
  // Discover and filter
  const allProjects = this.discoverProjects();
  const projectsToBuild = this.filterProjects(allProjects);
  
  if (projectsToBuild.length === 0) {
    console.log('No projects found to build.');
    return;
  }
  
  console.log(`Found ${projectsToBuild.length} project(s) to build:\n`);
  projectsToBuild.forEach(p => {
    console.log(`  - ${p.projectId} (${p.projectName})`);
  });
  console.log('');
  
  // Build each project sequentially
  for (const project of projectsToBuild) {
    await this.buildProject(project);
  }
  
  // Generate summary report
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  this.generateReport(totalTime);
  
  // Exit with appropriate code
  const failed = this.results.filter(r => r.status === 'failed').length;
  process.exit(failed > 0 ? 1 : 0);
}
```

---

### 4. Individual Project Build

#### Purpose
Execute build for a single project using generator.js

#### Process
```javascript
async buildProject(project) {
  console.log('='.repeat(60));
  console.log(`Building: ${project.projectId}`);
  console.log(`Name: ${project.projectName}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Build command with project parameter
    const buildCmd = `npm run build -- --project=${project.projectId}`;
    
    // Add promote flag if specified
    if (this.options.promote) {
      buildCmd += ' --promote';
    }
    
    // Execute build (synchronous, inherits stdio)
    execSync(buildCmd, { 
      stdio: 'inherit',  // Show build output in real-time
      cwd: process.cwd()
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    this.results.push({
      projectId: project.projectId,
      projectName: project.projectName,
      status: 'success',
      time: elapsed
    });
    
    console.log(`\n✓ ${project.projectId} completed in ${elapsed}s\n`);
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    this.results.push({
      projectId: project.projectId,
      projectName: project.projectName,
      status: 'failed',
      time: elapsed,
      error: error.message
    });
    
    console.error(`\n✗ ${project.projectId} FAILED after ${elapsed}s\n`);
    
    // Continue to next project (don't stop entire process)
    if (!this.options.stopOnError) {
      console.log('Continuing to next project...\n');
    } else {
      console.log('Stopping due to --stop-on-error flag\n');
      throw error;
    }
  }
}
```

---

### 5. Summary Report

#### Purpose
Display final results of all builds

#### Process
```javascript
generateReport(totalTime) {
  console.log('\n' + '='.repeat(60));
  console.log('BUILD SUMMARY');
  console.log('='.repeat(60));
  
  // List results
  this.results.forEach(result => {
    const icon = result.status === 'success' ? '✓' : '✗';
    const status = result.status.toUpperCase().padEnd(8);
    const time = `${result.time}s`.padStart(8);
    
    console.log(`  ${icon} ${status} ${result.projectId.padEnd(30)} ${time}`);
  });
  
  console.log('='.repeat(60));
  
  // Statistics
  const total = this.results.length;
  const successful = this.results.filter(r => r.status === 'success').length;
  const failed = this.results.filter(r => r.status === 'failed').length;
  
  console.log(`\nTotal: ${total} | Success: ${successful} | Failed: ${failed}`);
  console.log(`Total Time: ${totalTime}s\n`);
  
  // List failures with details
  if (failed > 0) {
    console.log('FAILED PROJECTS:');
    this.results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`  ✗ ${r.projectId}`);
        if (r.error) {
          console.log(`    Error: ${r.error}`);
        }
      });
    console.log('');
  }
}
```

#### Example Output
```
============================================================
BUILD SUMMARY
============================================================
  ✓ SUCCESS  ips-v1                           12.3s
  ✓ SUCCESS  client-abc                        8.7s
  ✗ FAILED   old-client                        2.1s
  ✓ SUCCESS  demo-site                        15.2s
============================================================

Total: 4 | Success: 3 | Failed: 1
Total Time: 38.3s

FAILED PROJECTS:
  ✗ old-client
    Error: Template version 'v0.9' not found
```

---

## Command Line Options

### Basic Usage
```bash
# Build all active projects
npm run build:all

# Build all projects (including archived)
npm run build:all -- --all

# Build specific projects
npm run build:all -- --projects=ips-v1,client-abc

# Build and promote to _dist
npm run build:all -- --promote

# Stop on first failure
npm run build:all -- --stop-on-error

# Verbose output
npm run build:all -- --verbose
```

### Options

#### `--all`
Build all projects regardless of status (active, archived, suspended)

**Default**: Only active projects

#### `--projects=id1,id2,id3`
Build only specified projects (comma-separated list)

**Example**: `--projects=ips-v1,client-abc`

#### `--promote`
Promote each successful build to `_dist/` (stable)

**Default**: Build to `_output/` only

#### `--stop-on-error`
Stop entire process on first project failure

**Default**: Continue to next project after failure

#### `--verbose`
Show detailed build output for each project

**Default**: Show summary output only

---

## Argument Parsing

### Parse Arguments Function
```javascript
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    projects: null,
    promote: false,
    stopOnError: false,
    verbose: false
  };
  
  args.forEach(arg => {
    if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--projects=')) {
      options.projects = arg.substring(11);
    } else if (arg === '--promote') {
      options.promote = true;
    } else if (arg === '--stop-on-error') {
      options.stopOnError = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  });
  
  return options;
}
```

---

## Error Handling

### No Projects Found
```javascript
if (projectsToBuild.length === 0) {
  console.log('No projects found to build.');
  console.log('');
  console.log('Possible reasons:');
  console.log('  - No projects exist in _projects/');
  console.log('  - All projects are archived (use --all to include)');
  console.log('  - Specified projects do not exist (check --projects flag)');
  process.exit(0);
}
```

### Build Failure Handling
```javascript
// Individual project failure
catch (error) {
  // Log error
  this.results.push({ status: 'failed', error: error.message });
  
  // Continue or stop based on --stop-on-error flag
  if (this.options.stopOnError) {
    throw error;
  } else {
    // Continue to next project
  }
}
```

### System Configuration Missing
```javascript
loadSystemConfig() {
  const configPath = path.join(__dirname, 'system_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('ERROR: system_config.json not found');
    console.error(`Expected at: ${configPath}`);
    process.exit(1);
  }
  
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
```

---

## Console Output Examples

### Startup
```
[Build-All] Starting sequential build of all projects...

Found 3 project(s) to build:

  - client-abc (Client ABC Website)
  - demo-site (Demo Website)
  - ips-v1 (inPowerSuite Website v1)

```

### During Build (per project)
```
============================================================
Building: ips-v1
Name: inPowerSuite Website v1
============================================================
[Builder] Loaded system config v1.0.0
[Builder] Loaded project: inPowerSuite Website v1
[Builder] Using template version: v1.0
[Renderer:inPowerSuite Website v1] Initialized
[Builder] Dependency graph complete
[Builder] Rendering 15 pages...
[Builder] ✓ Generated: index.html
[Builder] ✓ Generated: services.html
...
[Builder] Copying assets...
[Builder] ✓ Assets copied
[Builder] ✓ Created symlink: latest → build-20251225-143022
============================================================
✓ Build complete in 12.3s
Output: _output/ips-v1/build-20251225-143022/
============================================================

✓ ips-v1 completed in 12.3s

```

### Final Summary
```
============================================================
BUILD SUMMARY
============================================================
  ✓ SUCCESS  client-abc                        8.7s
  ✓ SUCCESS  demo-site                        15.2s
  ✓ SUCCESS  ips-v1                           12.3s
============================================================

Total: 3 | Success: 3 | Failed: 0
Total Time: 36.2s
```

---

## Testing Requirements

### Test Case 1: Build All Active Projects
```bash
npm run build:all

Setup:
- 2 active projects (ips-v1, client-abc)
- 1 archived project (old-site)

Expected:
✓ Discovers 3 projects
✓ Filters to 2 active projects
✓ Builds ips-v1 successfully
✓ Builds client-abc successfully
✓ Skips old-site (archived)
✓ Shows summary: 2 success, 0 failed
✓ Exits with code 0
```

### Test Case 2: Build All Projects (Including Archived)
```bash
npm run build:all -- --all

Expected:
✓ Discovers 3 projects
✓ Does NOT filter by status
✓ Builds all 3 projects
✓ Shows summary with all results
```

### Test Case 3: Build Specific Projects
```bash
npm run build:all -- --projects=ips-v1,demo-site

Expected:
✓ Discovers all projects
✓ Filters to specified projects only
✓ Builds ips-v1
✓ Builds demo-site
✓ Skips other projects
✓ Shows summary for 2 projects
```

### Test Case 4: Build with Promotion
```bash
npm run build:all -- --promote

Expected:
✓ Builds each project to _output/
✓ Promotes each success to _dist/
✓ Each project's _dist/ updated
✓ Promotion messages in output
```

### Test Case 5: Stop on Error
```bash
npm run build:all -- --stop-on-error

Setup:
- First project fails
- Two more projects exist

Expected:
✓ Starts building first project
✗ First project fails
✗ Process stops immediately
✗ Does NOT build remaining projects
✗ Exits with code 1
```

### Test Case 6: Continue on Error (Default)
```bash
npm run build:all

Setup:
- Second project fails
- Three projects total

Expected:
✓ Builds first project successfully
✗ Second project fails
✓ Continues to third project
✓ Builds third project successfully
✓ Summary shows: 2 success, 1 failed
✗ Exits with code 1 (due to failure)
```

### Test Case 7: No Projects Found
```bash
npm run build:all

Setup:
- Empty _projects/ directory

Expected:
✓ Message: "No projects found to build"
✓ Shows possible reasons
✓ Exits with code 0 (not an error)
```

---

## Integration with package.json

### Add Script
```json
{
  "scripts": {
    "build": "node _system/_buildr/generator.js",
    "build:all": "node _system/_buildr/build-all.js",
    "build:all:promote": "node _system/_buildr/build-all.js --promote",
    "dev": "node _system/_buildr/watcher.js"
  }
}
```

### Usage Examples
```bash
# Build all active projects
npm run build:all

# Build all projects (including archived)
npm run build:all -- --all

# Build and promote
npm run build:all:promote

# Build specific projects
npm run build:all -- --projects=ips-v1,client-abc

# Stop on first error
npm run build:all -- --stop-on-error
```

---

## Phase 2 Considerations

### Current (Phase 1): Sequential
```javascript
// Build projects one at a time
for (const project of projectsToBuild) {
  await this.buildProject(project);
}
```

### Future (Phase 2): Parallel
```javascript
// Build multiple projects concurrently
const maxConcurrent = this.systemConfig.build.maxConcurrentBuilds;
const chunks = this.chunkArray(projectsToBuild, maxConcurrent);

for (const chunk of chunks) {
  await Promise.all(
    chunk.map(project => this.buildProject(project))
  );
}
```

**Note**: Phase 2 parallel execution will be added later. Phase 1 focuses on sequential execution for simplicity and stability.

---

## Success Criteria

The new `build-all.js` will be considered successful when:

1. ✅ Discovers all projects correctly
2. ✅ Filters by status (active only by default)
3. ✅ Builds projects sequentially (Phase 1)
4. ✅ Handles build failures gracefully
5. ✅ Generates clear summary report
6. ✅ Supports all command-line options
7. ✅ Exits with appropriate code (0=success, 1=failures)
8. ✅ All test cases pass
9. ✅ Integrates with package.json
10. ✅ Ready for Phase 2 parallel enhancement

---

## Files to Reference

When implementing, review these files:

1. **generator.js**: `_system/_buildr/generator.js` (called for each project)
2. **System config**: `_system/_buildr/system_config.json`
3. **Project configs**: `_projects/*/project_config.json`
4. **cli.js**: `_system/_buildr/cli.js` (similar project discovery logic)

---

## Implementation Checklist

- [ ] Create `_system/_buildr/build-all.js`
- [ ] Add shebang and requires
- [ ] Implement `MultiProjectBuilder` class
- [ ] Implement project discovery (recursive scan)
- [ ] Implement project filtering (status, specific projects)
- [ ] Implement sequential build execution
- [ ] Implement summary report generation
- [ ] Add argument parsing
- [ ] Add error handling
- [ ] Add console output formatting
- [ ] Test all command-line options
- [ ] Update `package.json` scripts
- [ ] Document usage in README

---

## Next Steps After build-all.js

Once build-all.js is complete and tested:

1. ✅ watcher.js refactored (WEBLY-IMPL-001)
2. ✅ renderer.js refactored (WEBLY-IMPL-002)
3. ✅ generator.js refactored (WEBLY-IMPL-003)
4. ✅ cli.js created (WEBLY-IMPL-004)
5. ✅ build-all.js created (WEBLY-IMPL-005)
6. ⏭️ **Update package.json scripts** (final step)
7. ⏭️ **Complete migration documentation**
8. ⏭️ **Test entire system end-to-end**

---

## Implementation Chat Instructions

**Paste this brief into a new chat and request:**

> "Based on this continuity brief, create build-all.js as a new multi-project build orchestrator for Webly. Implement sequential execution (Phase 1), project discovery and filtering, proper error handling, and comprehensive summary reporting. Ensure it integrates with the refactored generator.js and provides clear console output."

---

## Additional Context

- **Design Philosophy**: Simple, sequential, reliable
- **Phase 1 Focus**: Sequential execution (one project at a time)
- **Error Strategy**: Continue on failure (unless --stop-on-error)
- **Output Style**: Clear progress and summary
- **Testing Strategy**: Test with multiple projects
- **Risk Level**: Low (simple orchestrator)
- **Dependencies**: Requires generator.js refactored
- **Repository**: https://github.com/Dlloyd0608/webly

---

## File Structure Reference

```
WEBLY_ROOT/
├── _system/
│   └── _buildr/
│       ├── build-all.js        ← THIS FILE (to be created)
│       ├── generator.js        ← Called by build-all
│       ├── system_config.json
│       └── ...
│
├── _projects/
│   ├── ips/v1/
│   │   └── project_config.json
│   ├── client-abc/
│   │   └── project_config.json
│   └── old-site/
│       └── project_config.json
│
└── _output/
    ├── ips-v1/
    ├── client-abc/
    └── old-site/
```

---

**END OF BRIEF**
