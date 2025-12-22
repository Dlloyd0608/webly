# webly
Static website builder app for multiple projects

## **I. System Overview**

### A. Purpose & Vision
- Meta-driven static site generator with CMS capabilities
- Multi-project, multi-language, multi-user platform
- Progression from file-based → database-driven → APEX-integrated

### B. Core Architecture Principles
- **Separation of Concerns**: Configuration, content, presentation, and build logic
- **Hub-and-Spoke Navigation**: 3-level hierarchical structure
- **Element-Based Content**: Modular, reusable content blocks
- **Static Site Generation**: Pre-rendered HTML for performance and SEO


## **II. Data Model & Configuration**

### A. Project Structure
1. **Website Project** (`site_config.json`)
   - Site identity (ID, name, branding)
   - Global settings (languages, themes, paths)
   - Contact information
   - Social media links

2. **Site Map** (`_menu.json`)
   - Primary navigation structure
   - Footer navigation
   - Hub-and-spoke relationships
   - Page metadata references

3. **Configuration Files**
   - `build_config.json` - Build system paths
   - `_layouts.json` - Section layout definitions
   - `_page-templates.json` - Page pattern definitions
   - `_header-layouts.json` - Header style definitions
   - `_navigation-layouts.json` - Secondary nav patterns

### B. Content Model
1. **Page Definition** (`*_page.json`)
   - Page metadata (title, description, keywords)
   - Template selection (layout, header, navigation)
   - Content source reference
   - Block ordering

2. **Page Content** (`*_content.json`)
   - Language-specific content
   - Content blocks with elements
   - Layout-specific configurations

3. **Content Elements** (14 supported types)
   - Text: title, paragraph
   - Lists: bullets, checkmarks, numbered
   - Media: image, carousel, video, icon
   - Interactive: callToAction, form fields, spacer

### C. Pattern Library
1. **Site-Level Patterns** (4 patterns)
   - Announcement Banner
   - App Header (logo + branding)
   - Primary Navigation Bar
   - Footer

2. **Content Patterns** (14 patterns)
   - Split Layouts (left/right/complex)
   - Stacked Layouts (image top/bottom)
   - Grid Layouts (2/3/4 columns)
   - Two-Column with Subtitles
   - Form Layouts (1-up/2-up)

---

## **III. User Roles & Workflows**

### A. User Roles
1. **Site Administrator**
   - Full system access
   - Project creation and configuration
   - Template and pattern management
   - User management (Phase 2+)
   - Build and deployment

2. **Content Contributor**
   - Limited to assigned projects
   - Content editing only
   - Asset upload
   - Style customization (within bounds)
   - Trigger builds (for assigned projects)

3. **Developer** (implicit role)
   - Template development
   - Pattern creation
   - Build system maintenance
   - Custom integrations

### B. Administrator Workflows
1. **Project Setup**
   - Create website project
   - Configure branding and themes
   - Define site map structure
   - Set up languages

2. **Template Management**
   - Create/edit page layout templates (.hbs)
   - Define page section patterns
   - Configure layout options

3. **Page Management**
   - Define page configurations
   - Map content to pages
   - Set up navigation relationships

4. **Build & Deploy**
   - Trigger full site rebuild
   - Monitor build logs
   - Deploy to production
   - Rollback if needed

### C. Contributor Workflows
1. **Content Editing**
   - Select project and language
   - Edit page content (element-based)
   - Preview changes
   - Trigger incremental build

2. **Asset Management**
   - Upload images/videos
   - Tag and categorize assets
   - Replace existing assets
   - Remove unused assets

3. **Style Customization**
   - Adjust theme variables
   - Upload custom CSS (if permitted)
   - Preview style changes

---

## **IV. Application Modules**

### A. Dashboard & Administration
1. **App Dashboard**
   - Multi-project overview
   - Build status per project
   - Recent activity feed
   - Storage usage metrics
   - Quick actions

2. **Project Management**
   - Project list/grid view
   - Create new project
   - Clone existing project
   - Project settings (branding, languages, paths)
   - Delete project (with safeguards)

3. **User Management** (Phase 2+)
   - User list
   - Create/edit users
   - Assign roles and permissions
   - Project access control
   - Activity audit log

### B. Configuration Modules
4. **Site Map Editor**
   - Visual hub-and-spoke diagram
   - Add/edit/remove pages
   - Configure navigation structure
   - Reorder menu items
   - Set active/inactive pages

5. **Theme & Style Manager**
   - Theme selection
   - Color palette editor
   - Typography settings
   - Custom CSS editor
   - Preview changes

6. **Page Template Designer**
   - Template list
   - Create new template (.hbs)
   - Edit existing templates
   - Preview with sample content
   - Template validation

7. **Section Pattern Library**
   - Browse 14 content patterns
   - Preview pattern variations
   - Pattern documentation
   - Usage examples
   - Custom pattern creation (advanced)

### C. Content Modules
8. **Page Definition Editor**
   - Select page from site map
   - Choose page template
   - Configure header layout
   - Set up secondary navigation
   - Link to content source
   - Define content block order

9. **Content Editor (Multi-Language)**
   - Language selector
   - Block-based editor
   - Element type selector (title, paragraph, list, etc.)
   - Rich text editing (with Markdown support)
   - Media picker/uploader
   - CTA configuration
   - Form builder (for form patterns)
   - Preview by layout
   - Save draft/publish

10. **Asset Library**
    - Grid/list view of assets
    - Upload (drag-drop or browse)
    - Organize by folders/tags
    - Search and filter
    - Edit metadata (alt text, captions)
    - Replace asset
    - Delete unused assets
    - Usage tracking (which pages use this asset)

### D. Build & Deploy
11. **Build Orchestrator**
    - Manual build trigger
    - Incremental vs. full build selection
    - Build queue management
    - Real-time build log
    - Error reporting
    - Build history
    - Scheduled builds (Phase 2+)

12. **Deployment Manager** (Phase 2+)
    - Environment selection (staging/production)
    - Pre-deployment checks
    - Deployment execution
    - Rollback capability
    - Deployment history
    - CDN cache purging

### E. Monitoring & Reports
13. **Build Logs & Analytics**
    - Build success/failure rates
    - Build duration trends
    - Error frequency by type
    - Page generation statistics

14. **Content Reports**
    - Pages by status (draft/published)
    - Missing translations
    - Outdated content alerts
    - Asset usage report
    - Orphaned assets

15. **SEO & Performance Reports** (Future)
    - Page load times
    - Lighthouse scores
    - Broken links
    - Missing meta descriptions
    - Keyword rankings (if integrated)

---

## **V. Build System Architecture**

### A. Build-Time Components
1. **Generator** (`generator.js`)
   - Build orchestrator
   - Dependency graph management
   - Page discovery from `_menu.json`
   - Build sequencing
   - Static asset copying

2. **Renderer** (`renderer.js`)
   - HTML generation engine
   - Handlebars template compilation
   - Element processor (14 element types)
   - Content block assembly
   - Page composition (header, nav, content, footer)

3. **Helpers** (`helpers.js` + `handlebars_helpers.js`)
   - Markdown processing
   - JSON utilities
   - String escaping
   - Date formatting
   - URL generation
   - Handlebars helper functions

4. **Watcher** (`watcher.js`)
   - File change detection
   - Incremental build triggers
   - Browser-sync integration
   - Live reload
   - Debounced rebuilds

### B. Directory Structure
```
PROJECT_ROOT/
├── build/              # Build system (Node.js)
├── site/               # Site configuration
├── src/                # Content source (by language)
│   └── {lang}/         # e.g., en, es, fr
│       └── {hub}/      # e.g., hub00, hub01
├── templates/          # Handlebars templates
│   ├── partials/       # Site-level patterns
│   └── layouts/        # Content patterns
├── styles/             # CSS files
├── assets/             # Media files
└── _dist/              # Generated output (HTML)
```

Important!  templates should be versioned, universal and available to all website proijects.


### C. Build Process
1. **Full Build** (`npm run build`)
   - Load all configurations
   - Discover all pages from `_menu.json`
   - Build dependency graph
   - Generate all pages
   - Copy static assets
   - Output to `_dist/`

2. **Incremental Build** (triggered by watcher)
   - Detect changed file
   - Determine rebuild scope
   - Rebuild affected pages only
   - Copy changed assets
   - Trigger browser refresh

3. **Development Mode** (`npm run dev`)
   - Start file watcher
   - Start browser-sync
   - Enable live reload
   - Incremental builds on save

---

## **VI. Technology Stack**

### A. Phase 1: File-Based (Current)
- **Output**: HTML5, CSS3, ES6 JavaScript
- **Data**: JSON files
- **Styles**: CSS3
- **Build System**: Node.js + ES6
- **Templates**: Handlebars (.hbs)
- **Dev Tools**: browser-sync, chokidar

### B. Phase 2: Database-Driven (Next)
- **Database**: Oracle DB
- **Data Layer**: JSON schemas → DB tables
- **API**: RESTful API for CRUD operations
- **Authentication**: Session-based or JWT
- **Same output**: HTML5, CSS3, ES6
- **Same templates**: Handlebars

### C. Phase 3: APEX-Integrated (Future)
- **Platform**: Oracle APEX
- **UI**: APEX forms and reports
- **Logic**: PL/SQL + JavaScript
- **Build System**: Hybrid (APEX + Node.js)
- **Templates**: Handlebars or APEX templates
- **Same output**: HTML5, CSS3, ES6

---

## **VII. Migration Path**

### A. Phase 1 Stabilization (Current Priority)
1. Fix "unstable" build system issues
2. Complete refactoring of runtime scripts
3. Comprehensive testing
4. Documentation completion
5. Performance optimization

### B. Phase 2 Migration Tasks
1. Database schema design
2. JSON → DB migration scripts
3. RESTful API development
4. Web-based UI for all modules (sections III-IV)
5. User authentication system
6. Multi-tenancy implementation
7. Version control for content
8. Backup and restore capabilities

### C. Phase 3 Enhancement Tasks
1. APEX application design
2. APEX form builders for all modules
3. APEX reports for analytics
4. PL/SQL build orchestrator
5. Integration with existing Node.js build system
6. Advanced workflow (approval chains)
7. Audit logging

---

## **VIII. Key Features by Phase**

| Feature | Phase 1 (File) | Phase 2 (DB) | Phase 3 (APEX) |
|---------|---------------|--------------|----------------|
| Multiple projects | ✅ Manual | ✅ Managed | ✅ Full UI |
| Multiple languages | ✅ Folders | ✅ DB tables | ✅ Translation UI |
| Page layouts | ✅ Templates | ✅ Templates | ✅ + APEX |
| User roles | ❌ None | ✅ DB-driven | ✅ APEX auth |
| Versioning | ❌ Git only | ✅ Content versions | ✅ Full history |
| Web UI | ❌ Code editor | ✅ Full UI | ✅ APEX UI |
| Asset management | ✅ File system | ✅ DB + storage | ✅ APEX + CDN |
| Build system | ✅ Node.js | ✅ Node.js | ✅ Hybrid |
| Deployment | ❌ Manual | ✅ Automated | ✅ Advanced |

---

=====================
Open questions to complete the outline
=====================

1. **User Management & Authentication**: The original outline mentions "multiple website administrators and content contributors" but doesn't detail authentication, roles, or permissions. Should I include sections for:
   - User roles and permissions (Admin vs Contributor capabilities)
   - Authentication/authorization system
   - Multi-tenant data isolation

answer: 
-- Yes, include sections for:
   - User roles and permissions (Admin vs Contributor capabilities)
   - Multi-tenant data isolation

Important!  
Phase-1 provide a common support user (id/password) per project and role.  
Phase-2 support named users (id/password) per project and role.

2. **Versioning Strategy**: You mention "project versioning" as a requirement. Should this include:
   - Git-like version control for content?
   - Rollback capabilities?
   - Publishing workflow (draft → review → publish)?
   - Version comparison tools?

answer:
-- Yes to all four items



3. **Form Handling**: The PDFs show form patterns (1-up, 2-up layouts) but don't explain:
   - Where form submissions go (email, database, API)?
   - Form validation rules management
   - Integration with CRM or marketing tools?

answer:
-- No form submission is this phase-1  
Note, the general idea is to generate mockups and with static sample data including error conditions.


4. **Current vs. Target State**: The phase 3 PDF shows the current implementation is "partially refactored" and "unstable." Should the reorganized outline:
   - Address stabilization of the current system?
   - Focus on the Phase 2 (database-driven) migration?
   - Jump directly to Phase 3 (APEX-driven)?

answer:
   -- Yes, stabilization is key for phase-1.  we need to focus on stablizing templates/patterns.


5. **Reports Module**: You mention "forms and reports" but the documentation focuses heavily on forms. What reports are needed:
   - Build logs and error reports?
   - Content analytics/usage?
   - Project status dashboards?
   - SEO performance reports?

answer:
-- Yes to all four items


6. **Asset Management**: Should the reorganized outline include:
   - Asset versioning and CDN integration?
     -- No, later phase
   - Image optimization pipeline?
     -- No, later phase
   - Video transcoding?
     -- No, later phase
   - Asset usage tracking (which pages use which assets)?
     -- Yes

7. **I18N Strategy**: Multiple languages are mentioned but not detailed. Should this cover:
   - Translation workflow (manual, API, or both)?
     -- manual phase-1, API in a latter phase.
   - Language-specific asset variants?
     -- No, later phase
   - RTL language support?
     -- No, later phase
   - Language fallback strategies?
     -- en
