#!/usr/bin/env node

/**
 * build-all.js
 * Multi-Project Build Orchestrator for Webly
 * 
 * Purpose: Discovers and builds all projects sequentially (Phase 1)
 * Location: _system/_buildr/build-all.js
 * 
 * Usage:
 *   npm run build:all                    # Build all active projects
 *   npm run build:all -- --all           # Include archived/suspended
 *   npm run build:all -- --projects=x,y  # Build specific projects
 *   npm run build:all -- --promote       # Promote to _dist
 *   npm run build:all -- --stop-on-error # Stop on first failure
 *   npm run build:all -- --verbose       # Show detailed messages
 * 
 * Post-Creation Steps (Unix/Mac):
 *   1. Make executable: chmod +x _system/_buildr/build-all.js
 *   2. Test: ./system/_buildr/build-all.js --help
 *   3. Or via npm: npm run build:all
 * 
 * On Windows, executable permissions not needed (use npm scripts).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * MultiProjectBuilder
 * Orchestrates sequential builds across multiple projects
 */
class MultiProjectBuilder {
  constructor(options = {}) {
    this.options = options;
    this.systemConfig = this.loadSystemConfig();
    this.results = [];
  }

  /**
   * Load system configuration
   * Location: _system/_buildr/system_config.json (same directory as this file)
   */
  loadSystemConfig() {
    const configPath = path.join(__dirname, 'system_config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('ERROR: system_config.json not found');
      console.error(`Expected at: ${configPath}`);
      console.error('');
      console.error('This file is required for build-all to function.');
      console.error('Please ensure the system configuration exists.');
      process.exit(1);
    }
    
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.error('ERROR: Failed to parse system_config.json');
      console.error(`Path: ${configPath}`);
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Discover all projects by scanning for project_config.json files
   * Recursively scans _projects/ directory (with depth limit)
   */
  discoverProjects() {
    const projectsRoot = this.systemConfig.paths.projectsRoot;
    const projects = [];
    
    if (!fs.existsSync(projectsRoot)) {
      return projects;
    }

    // Recursive directory scanner
    const scanDir = (dir, depth = 0) => {
      if (depth > 3) return; // Limit recursion depth to prevent infinite loops
      
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (error) {
        // Skip directories we can't read
        return;
      }
      
      entries.forEach(entry => {
        if (entry.isDirectory()) {
          const subPath = path.join(dir, entry.name);
          const configPath = path.join(subPath, 'project_config.json');
          
          if (fs.existsSync(configPath)) {
            // Found a project - load its config
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              projects.push({
                projectId: config.projectId,
                projectName: config.projectName,
                status: config.status || 'active',
                path: subPath,
                config: config
              });
            } catch (error) {
              console.warn(`Warning: Failed to parse ${configPath}`);
              console.warn(`  Error: ${error.message}`);
            }
          } else {
            // No config here, continue scanning subdirectories
            scanDir(subPath, depth + 1);
          }
        }
      });
    };
    
    scanDir(projectsRoot);
    
    return projects;
  }

  /**
   * Filter projects based on status and command-line options
   */
  filterProjects(projects) {
    let filtered = projects;
    
    // Filter by status (skip archived/suspended unless --all flag)
    if (!this.options.all) {
      filtered = filtered.filter(p => p.status === 'active');
    }
    
    // Filter by specific projects (if --projects flag provided)
    if (this.options.projects) {
      const targetIds = this.options.projects.split(',').map(id => id.trim());
      filtered = filtered.filter(p => targetIds.includes(p.projectId));
      
      // Warn about projects that weren't found
      const foundIds = filtered.map(p => p.projectId);
      const missingIds = targetIds.filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        console.warn('Warning: The following projects were not found:');
        missingIds.forEach(id => console.warn(`  - ${id}`));
        console.warn('');
      }
    }
    
    // Sort alphabetically by projectId for consistent ordering
    filtered.sort((a, b) => a.projectId.localeCompare(b.projectId));
    
    return filtered;
  }

  /**
   * Build a single project using npm script (calls generator.js)
   */
  async buildProject(project) {
    console.log('='.repeat(60));
    console.log(`Building: ${project.projectId}`);
    console.log(`Name: ${project.projectName}`);
    
    // Show additional details in verbose mode
    if (this.options.verbose) {
      console.log(`[Build-All] Project: ${project.projectId}`);
      console.log(`[Build-All] Template: ${project.config.template?.version || 'unknown'}`);
      console.log(`[Build-All] Status: ${project.status}`);
    }
    
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    try {
      // Build command using npm script (not direct Node execution)
      let buildCmd = `npm run build -- --project=${project.projectId}`;
      
      // Add promote flag if specified
      if (this.options.promote) {
        buildCmd += ' --promote';
      }
      
      // Execute build (synchronous, inherit stdio to show generator output)
      // Always use stdio: 'inherit' - show generator output in real-time
      execSync(buildCmd, { 
        stdio: 'inherit',  // Show build output in real-time (always, per spec)
        cwd: process.cwd()
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      this.results.push({
        projectId: project.projectId,
        projectName: project.projectName,
        status: 'success',
        time: elapsed
      });
      
      // Always show summary (non-verbose)
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
      
      // Continue to next project or stop based on --stop-on-error flag
      if (this.options.stopOnError) {
        console.log('Stopping due to --stop-on-error flag\n');
        throw error;
      } else {
        console.log('Continuing to next project...\n');
      }
    }
  }

  /**
   * Generate and display final build summary report
   */
  generateReport(totalTime) {
    console.log('\n' + '='.repeat(60));
    console.log('BUILD SUMMARY');
    console.log('='.repeat(60));
    
    // List all results with status icons
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
    
    // List failures with error details
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

  /**
   * Main execution: discover → filter → build → report
   */
  async buildAll() {
    console.log('[Build-All] Starting sequential build of all projects...\n');
    
    const startTime = Date.now();
    
    // Discover all projects
    const allProjects = this.discoverProjects();
    
    if (allProjects.length === 0) {
      console.log('No projects found in _projects/ directory.');
      console.log('');
      console.log('Please ensure:');
      console.log('  - Projects exist in the _projects/ directory');
      console.log('  - Each project has a project_config.json file');
      process.exit(0);
    }
    
    // Filter projects based on options
    const projectsToBuild = this.filterProjects(allProjects);
    
    if (projectsToBuild.length === 0) {
      console.log('No projects found to build.');
      console.log('');
      console.log('Possible reasons:');
      console.log('  - All projects are archived/suspended (use --all to include)');
      console.log('  - Specified projects do not exist (check --projects flag)');
      console.log('');
      console.log(`Total projects discovered: ${allProjects.length}`);
      allProjects.forEach(p => {
        console.log(`  - ${p.projectId} (${p.status})`);
      });
      process.exit(0);
    }
    
    console.log(`Found ${projectsToBuild.length} project(s) to build:\n`);
    projectsToBuild.forEach(p => {
      const statusLabel = p.status !== 'active' ? ` [${p.status}]` : '';
      console.log(`  - ${p.projectId} (${p.projectName})${statusLabel}`);
    });
    console.log('');
    
    // Build each project sequentially (Phase 1 requirement)
    for (const project of projectsToBuild) {
      await this.buildProject(project);
    }
    
    // Generate and display summary report
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    this.generateReport(totalTime);
    
    // Exit with appropriate code (0=all success, 1=any failures)
    const failed = this.results.filter(r => r.status === 'failed').length;
    process.exit(failed > 0 ? 1 : 0);
  }
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    projects: null,
    promote: false,
    stopOnError: false,
    verbose: false,
    help: false
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
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  });
  
  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Webly Multi-Project Build Orchestrator
Usage: npm run build:all [options]

Options:
  --all               Build all projects (including archived/suspended)
                      Default: Only active projects
  
  --projects=x,y,z    Build only specified projects (comma-separated)
                      Example: --projects=ips-v1,client-abc
  
  --promote           Promote successful builds to _dist/ (stable)
                      Default: Build to _output/ only
  
  --stop-on-error     Stop entire process on first project failure
                      Default: Continue to next project after failure
  
  --verbose           Show detailed build-all orchestration messages
                      Note: Generator output always shown (stdio: inherit)
  
  --help, -h          Show this help message

Examples:
  npm run build:all
  npm run build:all -- --all
  npm run build:all -- --projects=ips-v1,demo-site
  npm run build:all -- --promote
  npm run build:all -- --stop-on-error --verbose

Phase 1: Sequential builds (one at a time)
Phase 2: Parallel builds (coming later)
`);
}

/**
 * Main execution
 */
if (require.main === module) {
  const options = parseArgs();
  
  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  // Create builder and execute
  const builder = new MultiProjectBuilder(options);
  builder.buildAll().catch(error => {
    console.error('Build process failed:', error.message);
    process.exit(1);
  });
}

module.exports = MultiProjectBuilder;