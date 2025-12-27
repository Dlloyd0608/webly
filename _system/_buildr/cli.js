#!/usr/bin/env node

/**
 * Webly CLI - Multi-Project Management Tool
 * 
 * Command-line interface for managing Webly projects:
 * - Project discovery and inspection
 * - Project creation and cloning
 * - Template management
 * - Build output maintenance
 * 
 * Usage: node _system/_buildr/cli.js <command> [options]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse command-line arguments into key-value object
 * @returns {Object} Parsed arguments
 */
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

/**
 * Load system configuration
 * @returns {Object} System config object
 */
function loadSystemConfig() {
  const configPath = path.join(__dirname, 'system_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ ERROR: system_config.json not found');
    console.error(`   Expected: ${configPath}`);
    process.exit(1);
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('❌ ERROR: Failed to parse system_config.json');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

/**
 * Load project configuration
 * @param {string} projectId - Project identifier
 * @returns {Object} Project config object
 */
function loadProjectConfig(projectId) {
  const systemConfig = loadSystemConfig();
  const projectPath = resolveProjectPath(projectId, systemConfig);
  const configPath = path.join(projectPath, 'project_config.json');
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ ERROR: Project '${projectId}' not found`);
    console.error(`   Expected: ${configPath}`);
    process.exit(1);
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error(`❌ ERROR: Failed to parse project_config.json for '${projectId}'`);
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

/**
 * Resolve project path from project ID
 * @param {string} projectId - Project identifier
 * @param {Object} systemConfig - System configuration
 * @returns {string} Full project path
 */
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

/**
 * Get all projects by scanning directory
 * @param {Object} systemConfig - System configuration
 * @returns {Array} Array of project objects
 */
function getAllProjects(systemConfig) {
  const projects = [];
  const projectsRoot = systemConfig.paths.projectsRoot;
  
  function scanDirectory(dir, relativePath = '') {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Check if this directory has project_config.json
        const configPath = path.join(fullPath, 'project_config.json');
        if (fs.existsSync(configPath)) {
          try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            projects.push({
              id: config.projectId,
              path: fullPath,
              relativePath: path.relative(projectsRoot, fullPath),
              config: config
            });
          } catch (error) {
            console.warn(`⚠️  Warning: Failed to parse ${configPath}`);
          }
        } else {
          // Recursively scan subdirectories
          scanDirectory(fullPath, path.join(relativePath, entry.name));
        }
      }
    }
  }
  
  scanDirectory(projectsRoot);
  return projects;
}

/**
 * Prompt user for confirmation
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User's response
 */
function confirm(message) {
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

/**
 * Format ISO date string for display
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(isoString) {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Validate project ID format
 * @param {string} projectId - Project identifier
 * @returns {boolean} True if valid
 */
function isValidProjectId(projectId) {
  return /^[a-z0-9-]+$/.test(projectId);
}

/**
 * Get directory size in bytes
 * @param {string} dirPath - Directory path
 * @returns {number} Total size in bytes
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else {
        try {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        } catch (error) {
          // Skip files we can't read
        }
      }
    }
  }
  
  scanDir(dirPath);
  return totalSize;
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
}

/**
 * Recursively copy directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Recursively remove directory
 * @param {string} dirPath - Directory to remove
 */
function removeDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeDirectory(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  
  fs.rmdirSync(dirPath);
}

/**
 * Count builds in output directory
 * @param {string} projectId - Project identifier
 * @param {Object} systemConfig - System configuration
 * @returns {number} Number of builds
 */
function countBuilds(projectId, systemConfig) {
  const outputPath = path.join(systemConfig.paths.outputRoot, projectId);
  if (!fs.existsSync(outputPath)) return 0;
  
  const entries = fs.readdirSync(outputPath, { withFileTypes: true });
  return entries.filter(e => e.isDirectory() && e.name.startsWith('build-')).length;
}

/**
 * Validate template exists
 * @param {string} version - Template version
 * @param {Object} systemConfig - System configuration
 * @returns {boolean} True if template exists
 */
function validateTemplate(version, systemConfig) {
  const templatePath = path.join(systemConfig.paths.templatesRoot, version);
  
  if (!fs.existsSync(templatePath)) {
    return false;
  }
  
  // Check for required subdirectories
  const requiredDirs = ['partials', 'layouts'];
  for (const dir of requiredDirs) {
    const dirPath = path.join(templatePath, dir);
    if (!fs.existsSync(dirPath)) {
      return false;
    }
    
    // Check that directory has .hbs files
    const files = fs.readdirSync(dirPath);
    if (!files.some(f => f.endsWith('.hbs'))) {
      return false;
    }
  }
  
  return true;
}

// =============================================================================
// COMMAND IMPLEMENTATIONS
// =============================================================================

/**
 * LIST COMMAND: Display all projects
 */
function listProjects() {
  const systemConfig = loadSystemConfig();
  const projects = getAllProjects(systemConfig);
  
  if (projects.length === 0) {
    console.log('📁 Webly Projects:\n');
    console.log('   No projects found in', systemConfig.paths.projectsRoot);
    console.log('\n💡 Create a project with: node cli.js create --id=my-project --name="My Project"');
    return;
  }
  
  // Group by status
  const active = projects.filter(p => p.config.projectStatus === 'active');
  const archived = projects.filter(p => p.config.projectStatus === 'archived');
  const suspended = projects.filter(p => p.config.projectStatus === 'suspended');
  
  console.log('📁 Webly Projects:\n');
  
  // Display active projects
  if (active.length > 0) {
    for (const project of active.sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  ${project.id}`);
      console.log(`    Name: ${project.config.projectName}`);
      console.log(`    Status: ${project.config.projectStatus}`);
      console.log(`    Template: ${project.config.template.version}`);
      console.log(`    Last Built: ${formatDate(project.config.lastBuild)}`);
      console.log(`    Path: ${project.relativePath}/`);
      console.log('');
    }
  }
  
  // Display archived projects
  if (archived.length > 0) {
    console.log('  📦 Archived Projects:\n');
    for (const project of archived.sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  ${project.id}`);
      console.log(`    Name: ${project.config.projectName}`);
      console.log(`    Path: ${project.relativePath}/`);
      console.log('');
    }
  }
  
  // Display suspended projects
  if (suspended.length > 0) {
    console.log('  ⏸️  Suspended Projects:\n');
    for (const project of suspended.sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  ${project.id}`);
      console.log(`    Name: ${project.config.projectName}`);
      console.log(`    Path: ${project.relativePath}/`);
      console.log('');
    }
  }
  
  console.log(`Total: ${projects.length} projects (${active.length} active, ${archived.length} archived, ${suspended.length} suspended)`);
}

/**
 * INFO COMMAND: Show detailed project information
 */
function showProjectInfo() {
  const args = parseArgs();
  
  if (!args.project) {
    console.error('❌ ERROR: --project parameter required');
    console.error('   Usage: cli.js info --project=<id>');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const projectConfig = loadProjectConfig(args.project);
  const projectPath = resolveProjectPath(args.project, systemConfig);
  const outputPath = path.join(systemConfig.paths.outputRoot, args.project);
  const distPath = path.join(projectPath, '_dist');
  
  console.log('📋 Project Information\n');
  
  console.log(`Project ID:       ${projectConfig.projectId}`);
  console.log(`Project Name:     ${projectConfig.projectName}`);
  console.log(`Client Name:      ${projectConfig.clientName}`);
  console.log(`Status:           ${projectConfig.projectStatus}`);
  console.log(`Created:          ${formatDate(projectConfig.createdDate)}`);
  console.log(`Last Modified:    ${formatDate(projectConfig.lastModified)}`);
  console.log(`Last Built:       ${formatDate(projectConfig.lastBuild)}`);
  
  console.log('\nTemplate:');
  console.log(`  Version:        ${projectConfig.template.version}`);
  console.log(`  Upgrade Policy: ${projectConfig.template.upgradePolicy}`);
  console.log(`  Auto Upgrade:   ${projectConfig.template.autoUpgrade}`);
  
  console.log('\nLanguages:');
  console.log(`  Default:        ${projectConfig.languages.default}`);
  console.log(`  Supported:      ${projectConfig.languages.supported.join(', ')}`);
  
  console.log('\nPaths:');
  console.log(`  Project:        ${projectPath}/`);
  console.log(`  Output:         ${outputPath}/`);
  console.log(`  Dist:           ${distPath}/`);
  
  console.log('\nBuild Settings:');
  console.log(`  Mode:           ${projectConfig.build.mode}`);
  console.log(`  Use Shared:     styles=${projectConfig.build.useSharedStyles}, scripts=${projectConfig.build.useSharedScripts}, assets=${projectConfig.build.useSharedAssets}`);
  console.log(`  Promote:        ${projectConfig.build.promoteToStable}`);
  console.log(`  Timestamped:    ${projectConfig.build.timestampedBuilds}`);
  
  if (projectConfig.deployment) {
    console.log('\nDeployment:');
    if (projectConfig.deployment.staging) {
      console.log(`  Staging:        ${projectConfig.deployment.staging}`);
    }
    if (projectConfig.deployment.production) {
      console.log(`  Production:     ${projectConfig.deployment.production}`);
    }
  }
  
  if (projectConfig.users && projectConfig.users.length > 0) {
    console.log('\nUsers:');
    projectConfig.users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });
  }
  
  // List recent builds
  if (fs.existsSync(outputPath)) {
    const builds = fs.readdirSync(outputPath, { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name.startsWith('build-'))
      .map(e => e.name)
      .sort()
      .reverse()
      .slice(0, 5);
    
    if (builds.length > 0) {
      console.log('\nRecent Builds:');
      builds.forEach((build, i) => {
        const label = i === 0 ? ' (latest)' : '';
        console.log(`  ${i + 1}. ${build}${label}`);
      });
    }
  }
}

/**
 * CREATE COMMAND: Create new project
 */
async function createProject() {
  const args = parseArgs();
  
  if (!args.id) {
    console.error('❌ ERROR: --id parameter required');
    console.error('   Usage: cli.js create --id=<id> --name="Project Name"');
    process.exit(1);
  }
  
  if (!args.name) {
    console.error('❌ ERROR: --name parameter required');
    console.error('   Usage: cli.js create --id=<id> --name="Project Name"');
    process.exit(1);
  }
  
  // Validate project ID
  if (!isValidProjectId(args.id)) {
    console.error('❌ ERROR: Invalid project ID');
    console.error('   Project IDs must be lowercase letters, numbers, and hyphens only');
    console.error('   Example: my-project, client-abc, ips-v2');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const projectPath = resolveProjectPath(args.id, systemConfig);
  
  // Check if project already exists
  if (fs.existsSync(projectPath)) {
    console.error(`❌ ERROR: Project '${args.id}' already exists`);
    console.error(`   Path: ${projectPath}`);
    process.exit(1);
  }
  
  // Get template version
  const templateVersion = args.template || systemConfig.templates.defaultVersion;
  
  // Validate template exists
  if (!validateTemplate(templateVersion, systemConfig)) {
    console.error(`❌ ERROR: Template version '${templateVersion}' not found`);
    console.error(`   Available: ${systemConfig.templates.supportedVersions.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Creating new project: ${args.id}\n`);
  
  // Create directory structure
  const directories = [
    projectPath,
    path.join(projectPath, 'site'),
    path.join(projectPath, 'src', args.lang || 'en', 'hub00'),
    path.join(projectPath, 'assets', 'images'),
    path.join(projectPath, 'styles'),
    path.join(projectPath, 'scripts'),
    path.join(projectPath, '_dist')
  ];
  
  for (const dir of directories) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${path.relative(process.cwd(), dir)}/`);
  }
  
  // Create project_config.json
  const projectConfig = {
    projectId: args.id,
    projectName: args.name,
    clientName: args.client || '',
    projectStatus: args.status || 'active',
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    lastBuild: null,
    template: {
      version: templateVersion,
      upgradePolicy: 'manual',
      autoUpgrade: false
    },
    languages: {
      default: args.lang || 'en',
      supported: [args.lang || 'en']
    },
    build: {
      mode: 'development',
      useSharedStyles: true,
      useSharedScripts: true,
      useSharedAssets: true,
      promoteToStable: false,
      timestampedBuilds: true
    },
    deployment: {
      staging: '',
      production: ''
    },
    users: []
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'project_config.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  console.log('✓ Created project_config.json');
  
  // Create minimal site_config.json template
  const siteConfig = {
    siteName: args.name,
    siteDescription: '',
    baseUrl: '',
    language: args.lang || 'en',
    navigation: {
      enabled: true,
      style: 'standard'
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'site', 'site_config.json'),
    JSON.stringify(siteConfig, null, 2)
  );
  console.log('✓ Created site_config.json (template)');
  
  // Create minimal _menu.json template
  const menuConfig = {
    menuItems: [
      {
        id: 'home',
        label: 'Home',
        url: '/index.html'
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'site', '_menu.json'),
    JSON.stringify(menuConfig, null, 2)
  );
  console.log('✓ Created _menu.json (template)');
  
  // Create README
  const readme = `# ${args.name}

Project ID: ${args.id}
Created: ${new Date().toISOString().split('T')[0]}

## Quick Start

1. Edit configuration:
   - project_config.json (project settings)
   - site/site_config.json (site configuration)
   - site/_menu.json (navigation)

2. Add content to:
   - src/${args.lang || 'en'}/hub00/

3. Build project:
   npm run build -- --project=${args.id}

## Directory Structure

- /site/ - Site configuration
- /src/ - Content source files
- /assets/ - Images and media
- /styles/ - Project-specific styles
- /scripts/ - Project-specific scripts
- /_dist/ - Stable production build
`;
  
  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
  console.log('✓ Created README.md');
  
  console.log(`\n✓ Project '${args.id}' created successfully!\n`);
  console.log('Next steps:');
  console.log(`  1. Edit configuration: ${path.relative(process.cwd(), path.join(projectPath, 'project_config.json'))}`);
  console.log(`  2. Configure site: ${path.relative(process.cwd(), path.join(projectPath, 'site', 'site_config.json'))}`);
  console.log(`  3. Add content to: ${path.relative(process.cwd(), path.join(projectPath, 'src', args.lang || 'en', 'hub00'))}/`);
  console.log(`  4. Build project: npm run build -- --project=${args.id}`);
}

/**
 * CLONE COMMAND: Clone existing project
 */
async function cloneProject() {
  const args = parseArgs();
  
  if (!args.source) {
    console.error('❌ ERROR: --source parameter required');
    console.error('   Usage: cli.js clone --source=<id> --target=<id>');
    process.exit(1);
  }
  
  if (!args.target) {
    console.error('❌ ERROR: --target parameter required');
    console.error('   Usage: cli.js clone --source=<id> --target=<id>');
    process.exit(1);
  }
  
  // Validate target project ID
  if (!isValidProjectId(args.target)) {
    console.error('❌ ERROR: Invalid target project ID');
    console.error('   Project IDs must be lowercase letters, numbers, and hyphens only');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const sourceConfig = loadProjectConfig(args.source);
  const sourcePath = resolveProjectPath(args.source, systemConfig);
  const targetPath = resolveProjectPath(args.target, systemConfig);
  
  // Check if target already exists
  if (fs.existsSync(targetPath)) {
    console.error(`❌ ERROR: Project '${args.target}' already exists`);
    console.error(`   Path: ${targetPath}`);
    process.exit(1);
  }
  
  console.log(`Cloning project: ${args.source} → ${args.target}\n`);
  
  // Copy entire project directory
  copyDirectory(sourcePath, targetPath);
  console.log('✓ Copied project directory');
  
  // Update project_config.json
  const targetConfig = {
    ...sourceConfig,
    projectId: args.target,
    projectName: args.name || `${sourceConfig.projectName} (Clone)`,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    lastBuild: null
  };
  
  fs.writeFileSync(
    path.join(targetPath, 'project_config.json'),
    JSON.stringify(targetConfig, null, 2)
  );
  
  console.log('✓ Updated project_config.json');
  console.log(`  - Project ID: ${args.target}`);
  console.log(`  - Project Name: ${targetConfig.projectName}`);
  console.log(`  - Created: ${targetConfig.createdDate}`);
  console.log('  - Cleared build history');
  
  // Clear _dist directory
  const distPath = path.join(targetPath, '_dist');
  if (fs.existsSync(distPath)) {
    removeDirectory(distPath);
    fs.mkdirSync(distPath);
    console.log('✓ Cleared _dist directory');
  }
  
  console.log(`\n✓ Project '${args.target}' created from '${args.source}'!\n`);
  console.log('Next steps:');
  console.log(`  1. Review configuration: ${path.relative(process.cwd(), path.join(targetPath, 'project_config.json'))}`);
  console.log('  2. Update content as needed');
  console.log(`  3. Build project: npm run build -- --project=${args.target}`);
}

/**
 * ARCHIVE COMMAND: Archive project
 */
async function archiveProject() {
  const args = parseArgs();
  
  if (!args.project) {
    console.error('❌ ERROR: --project parameter required');
    console.error('   Usage: cli.js archive --project=<id>');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const projectConfig = loadProjectConfig(args.project);
  const projectPath = resolveProjectPath(args.project, systemConfig);
  
  console.log(`Archive project: ${args.project}\n`);
  console.log('This will:');
  console.log('  - Change status to "archived"');
  console.log('  - Lock template version');
  console.log('  - Project will not appear in active lists');
  console.log('  - Files will be preserved\n');
  
  // Confirm unless --confirm=yes
  if (args.confirm !== 'yes') {
    const confirmed = await confirm('Proceed?');
    if (!confirmed) {
      console.log('\n❌ Archive cancelled');
      return;
    }
  }
  
  // Update configuration
  projectConfig.projectStatus = 'archived';
  projectConfig.template.upgradePolicy = 'locked';
  projectConfig.lastModified = new Date().toISOString();
  
  fs.writeFileSync(
    path.join(projectPath, 'project_config.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  console.log('\n✓ Updated project status to "archived"');
  console.log(`✓ Locked template version at ${projectConfig.template.version}`);
  console.log('✓ Project configuration saved');
  console.log(`\n✓ Project '${args.project}' has been archived.`);
  console.log(`Files preserved at: ${projectPath}/`);
}

/**
 * LIST-TEMPLATES COMMAND: List available template versions
 */
function listTemplates() {
  const systemConfig = loadSystemConfig();
  const templatesRoot = systemConfig.paths.templatesRoot;
  
  if (!fs.existsSync(templatesRoot)) {
    console.log('📦 Template Versions:\n');
    console.log('   No templates directory found');
    console.log(`   Expected: ${templatesRoot}`);
    return;
  }
  
  // Get all template versions
  const versions = fs.readdirSync(templatesRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();
  
  if (versions.length === 0) {
    console.log('📦 Template Versions:\n');
    console.log('   No template versions found');
    return;
  }
  
  // Get all projects and their template usage
  const projects = getAllProjects(systemConfig);
  const templateUsage = {};
  
  versions.forEach(v => {
    templateUsage[v] = projects.filter(p => p.config.template.version === v);
  });
  
  console.log('📦 Template Versions:\n');
  console.log('Available Versions:');
  
  versions.forEach(version => {
    const projectCount = templateUsage[version].length;
    const isLatest = version === systemConfig.templates.latestVersion ? ' (latest)' : '';
    const isDefault = version === systemConfig.templates.defaultVersion ? ' (default)' : '';
    
    console.log(`  ${version}${isDefault}${isLatest} (${projectCount} project${projectCount !== 1 ? 's' : ''})`);
    
    if (projectCount > 0) {
      templateUsage[version].forEach(p => {
        console.log(`    - ${p.id} (${p.config.template.upgradePolicy})`);
      });
    }
    console.log('');
  });
  
  console.log(`\nSystem Default: ${systemConfig.templates.defaultVersion}`);
  console.log(`Latest Version: ${systemConfig.templates.latestVersion}`);
  console.log(`\nTemplate Directory: ${templatesRoot}/`);
}

/**
 * UPGRADE-TEMPLATE COMMAND: Upgrade project template version
 */
function upgradeTemplate() {
  const args = parseArgs();
  
  if (!args.project) {
    console.error('❌ ERROR: --project parameter required');
    console.error('   Usage: cli.js upgrade-template --project=<id> --version=<ver>');
    process.exit(1);
  }
  
  if (!args.version) {
    console.error('❌ ERROR: --version parameter required');
    console.error('   Usage: cli.js upgrade-template --project=<id> --version=<ver>');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const projectConfig = loadProjectConfig(args.project);
  const projectPath = resolveProjectPath(args.project, systemConfig);
  
  // Validate template version exists
  if (!validateTemplate(args.version, systemConfig)) {
    console.error(`❌ ERROR: Template version '${args.version}' not found`);
    console.error(`   Available: ${systemConfig.templates.supportedVersions.join(', ')}`);
    process.exit(1);
  }
  
  // Check if project is locked
  if (projectConfig.template.upgradePolicy === 'locked') {
    console.error(`❌ ERROR: Project '${args.project}' has locked template upgrades`);
    console.error('   Change upgradePolicy to "manual" or "auto" first');
    process.exit(1);
  }
  
  const currentVersion = projectConfig.template.version;
  const targetVersion = args.version;
  const policy = args.policy || projectConfig.template.upgradePolicy;
  
  console.log(`Upgrading template for: ${args.project}\n`);
  console.log(`Current: ${currentVersion} (${projectConfig.template.upgradePolicy})`);
  console.log(`Target:  ${targetVersion} (${policy})\n`);
  
  // Update configuration
  projectConfig.template.version = targetVersion;
  projectConfig.template.upgradePolicy = policy;
  projectConfig.lastModified = new Date().toISOString();
  
  fs.writeFileSync(
    path.join(projectPath, 'project_config.json'),
    JSON.stringify(projectConfig, null, 2)
  );
  
  console.log(`✓ Template version updated to ${targetVersion}`);
  console.log(`✓ Upgrade policy: ${policy}`);
  console.log('\n✓ Project configuration saved.\n');
  console.log('⚠️  IMPORTANT: Rebuild required to use new templates');
  console.log(`    Run: npm run build -- --project=${args.project} --full-rebuild`);
}

/**
 * CLEAN COMMAND: Clean project output
 */
async function cleanProject() {
  const args = parseArgs();
  
  if (!args.project) {
    console.error('❌ ERROR: --project parameter required');
    console.error('   Usage: cli.js clean --project=<id>');
    process.exit(1);
  }
  
  const systemConfig = loadSystemConfig();
  const projectPath = resolveProjectPath(args.project, systemConfig);
  const outputPath = path.join(systemConfig.paths.outputRoot, args.project);
  const distPath = path.join(projectPath, '_dist');
  
  // Check if project exists
  if (!fs.existsSync(projectPath)) {
    console.error(`❌ ERROR: Project '${args.project}' not found`);
    process.exit(1);
  }
  
  console.log(`Clean output for: ${args.project}\n`);
  
  // List what will be removed
  const itemsToRemove = [];
  let outputSize = 0;
  let distSize = 0;
  
  if (fs.existsSync(outputPath)) {
    outputSize = getDirectorySize(outputPath);
    itemsToRemove.push(`  - ${outputPath}/ (all builds)`);
    
    const latestLink = path.join(outputPath, 'latest');
    if (fs.existsSync(latestLink)) {
      itemsToRemove.push(`  - Symlink: ${latestLink}/`);
    }
  }
  
  if (args.dist && fs.existsSync(distPath)) {
    distSize = getDirectorySize(distPath);
    itemsToRemove.push(`  - ${distPath}/ (stable build)`);
  }
  
  if (itemsToRemove.length === 0) {
    console.log('✓ Nothing to clean (no build output found)');
    return;
  }
  
  // Dry run mode
  if (args['dry-run']) {
    console.log('[DRY RUN] Would remove:');
    itemsToRemove.forEach(item => console.log(item));
    
    const totalSize = outputSize + distSize;
    console.log(`\nTotal: ${formatBytes(totalSize)} would be freed\n`);
    console.log('No files were deleted (dry run mode)');
    return;
  }
  
  console.log('This will remove:');
  itemsToRemove.forEach(item => console.log(item));
  
  if (args.dist) {
    console.log('\n⚠️  WARNING: This will delete the stable production build!');
  }
  
  console.log('');
  
  // Confirm unless --confirm=yes
  if (args.confirm !== 'yes') {
    const confirmed = await confirm('Proceed?');
    if (!confirmed) {
      console.log('\n❌ Clean cancelled');
      return;
    }
  }
  
  console.log('');
  
  // Remove output directory
  if (fs.existsSync(outputPath)) {
    const buildCount = countBuilds(args.project, systemConfig);
    removeDirectory(outputPath);
    console.log(`✓ Removed ${buildCount} builds from ${outputPath}/`);
  }
  
  // Remove dist directory if requested
  if (args.dist && fs.existsSync(distPath)) {
    removeDirectory(distPath);
    fs.mkdirSync(distPath);
    console.log(`✓ Removed directory: ${distPath}/`);
  }
  
  const totalSize = outputSize + distSize;
  console.log(`\n✓ Output cleaned for '${args.project}' (${formatBytes(totalSize)} freed)`);
}

/**
 * CLEAN-ALL COMMAND: Clean all project outputs
 */
async function cleanAllProjects() {
  const args = parseArgs();
  const systemConfig = loadSystemConfig();
  const outputRoot = systemConfig.paths.outputRoot;
  
  if (!fs.existsSync(outputRoot)) {
    console.log('✓ Nothing to clean (output directory does not exist)');
    return;
  }
  
  // Get all project output directories
  const projectDirs = fs.readdirSync(outputRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({
      name: e.name,
      path: path.join(outputRoot, e.name),
      buildCount: countBuilds(e.name, systemConfig),
      size: getDirectorySize(path.join(outputRoot, e.name))
    }))
    .filter(p => p.buildCount > 0);
  
  if (projectDirs.length === 0) {
    console.log('✓ Nothing to clean (no builds found)');
    return;
  }
  
  console.log('Clean output for ALL projects\n');
  
  // Dry run mode
  if (args['dry-run']) {
    console.log('[DRY RUN] Would remove builds for:');
    projectDirs.forEach(p => {
      console.log(`  - ${p.name} (${p.buildCount} builds, ${formatBytes(p.size)})`);
    });
    
    const totalBuilds = projectDirs.reduce((sum, p) => sum + p.buildCount, 0);
    const totalSize = projectDirs.reduce((sum, p) => sum + p.size, 0);
    
    console.log(`\nTotal: ${totalBuilds} builds, ${formatBytes(totalSize)} would be freed\n`);
    console.log('No files were deleted (dry run mode)');
    return;
  }
  
  console.log('This will remove builds for:');
  projectDirs.forEach(p => {
    console.log(`  - ${p.name} (${p.buildCount} builds, ${formatBytes(p.size)})`);
  });
  
  const totalBuilds = projectDirs.reduce((sum, p) => sum + p.buildCount, 0);
  const totalSize = projectDirs.reduce((sum, p) => sum + p.size, 0);
  
  console.log(`\nTotal: ${totalBuilds} builds, ${formatBytes(totalSize)}\n`);
  
  // Confirm unless --confirm=yes
  if (args.confirm !== 'yes') {
    const confirmed = await confirm('Proceed?');
    if (!confirmed) {
      console.log('\n❌ Clean cancelled');
      return;
    }
  }
  
  console.log('');
  
  // Remove each project's output
  for (const project of projectDirs) {
    removeDirectory(project.path);
    console.log(`✓ Cleaned: ${project.name} (${project.buildCount} builds removed, ${formatBytes(project.size)})`);
  }
  
  console.log(`\n✓ All project outputs cleaned (${formatBytes(totalSize)} freed)`);
}

/**
 * HELP COMMAND: Display usage information
 */
function showHelp() {
  console.log('Webly CLI - Multi-Project Management Tool\n');
  console.log('Usage: node _system/_buildr/cli.js <command> [options]\n');
  
  console.log('COMMANDS:\n');
  
  console.log('Project Management:');
  console.log('  list                         List all projects');
  console.log('  info --project=<id>         Show project details');
  console.log('  create --id=<id> --name="Name"  Create new project');
  console.log('  clone --source=<id> --target=<id>  Clone existing project');
  console.log('  archive --project=<id>      Archive project\n');
  
  console.log('Template Management:');
  console.log('  list-templates              List available template versions');
  console.log('  upgrade-template --project=<id> --version=<ver>  Upgrade project template\n');
  
  console.log('Maintenance:');
  console.log('  clean --project=<id>        Clean project output');
  console.log('  clean-all                   Clean all project outputs\n');
  
  console.log('OPTIONS:');
  console.log('  --project=<id>              Project ID');
  console.log('  --name="Name"               Project name');
  console.log('  --template=<version>        Template version');
  console.log('  --confirm=yes               Skip confirmation prompts');
  console.log('  --dist                      Include _dist directory (clean command)');
  console.log('  --dry-run                   Preview what would be deleted (clean commands)\n');
  
  console.log('EXAMPLES:');
  console.log('  node _system/_buildr/cli.js list');
  console.log('  node _system/_buildr/cli.js info --project=ips-v1');
  console.log('  node _system/_buildr/cli.js create --id=client-new --name="New Client"');
  console.log('  node _system/_buildr/cli.js clean --project=ips-v1 --dry-run');
  console.log('  node _system/_buildr/cli.js clean-all --confirm=yes\n');
  
  console.log('For more information, see: _system/_docs/');
}

// =============================================================================
// COMMAND ROUTING
// =============================================================================

const commands = {
  'list': listProjects,
  'info': showProjectInfo,
  'create': createProject,
  'clone': cloneProject,
  'archive': archiveProject,
  'list-templates': listTemplates,
  'upgrade-template': upgradeTemplate,
  'clean': cleanProject,
  'clean-all': cleanAllProjects,
  'help': showHelp
};

// Get command from arguments
const command = process.argv[2];

// Execute command or show help
if (!command || command === 'help') {
  showHelp();
} else if (commands[command]) {
  commands[command]().catch(error => {
    console.error('\n❌ Command failed:', error.message);
    process.exit(1);
  });
} else {
  console.error(`❌ Unknown command: ${command}`);
  console.error('   Run "node cli.js help" for usage information');
  process.exit(1);
}