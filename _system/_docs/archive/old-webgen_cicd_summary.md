# WebGen Hybrid CI/CD - Summary & Next Steps

## Executive Summary

The WebGen Phase 1 project is being enhanced with a **Hybrid rendering approach** (Option C) that combines the best of static site generation and dynamic updates. This document outlines the complete CI/CD architecture, implementation plan, and next steps.

---

## Architecture Overview

### Three-Process Model

```
┌─────────────────────────────────────────────────────┐
│  DAEMON PROCESS (Always Running)                    │
│  npm run cms-watcher                                │
│  ├── Monitors file changes (data/, framework/)      │
│  ├── Delegates work to appropriate worker           │
│  └── Refreshes browser after builds                 │
└─────────────────────────────────────────────────────┘
              ↓                    ↓
┌──────────────────────┐  ┌──────────────────────────┐
│  WORKER BEE 1        │  │  WORKER BEE 2            │
│  npm run             │  │  npm run                 │
│  cms-regen-page      │  │  cms-regen-site          │
│  ├── Rebuilds 1-3    │  │  ├── Rebuilds all 50     │
│  │   specific pages  │  │  │   pages               │
│  ├── Atomic file     │  │  ├── Blue-green          │
│  │   replacement     │  │  │   deployment          │
│  └── Exits when done │  │  └── Exits when done     │
└──────────────────────┘  └──────────────────────────┘
```

---

## NPM Commands Reference

### Primary Commands (Explicit)

| Command | Purpose | Usage | Runs |
|---------|---------|-------|------|
| `npm run cms-watcher` | Start file monitoring daemon | Development | Continuously |
| `npm run cms-regen-page` | Rebuild specific page(s) | Called by daemon or manual | Exits after completion |
| `npm run cms-regen-site` | Rebuild entire site | Called by daemon or manual | Exits after completion |

### Convenience Aliases (Developer-Friendly)

| Command | Maps To | Common Use Case |
|---------|---------|-----------------|
| `npm run dev` | `cms-watcher` | Start development work |
| `npm start` | `cms-watcher` | Standard Node.js convention |
| `npm run build` | `cms-regen-site` | Pre-deployment build |

---

## Build Strategies

### Strategy 1: Incremental (95% of Updates)

**Trigger**: Content or single page config changes

**Process**:
1. SME edits `mlm.content.json`
2. Daemon detects change
3. Spawns: `npm run cms-regen-page -- --file="mlm.content.json"`
4. Worker builds to: `dist/.temp/mlm.html.tmp`
5. Worker atomically renames to: `dist/mlm.html`
6. Worker exits
7. Daemon refreshes browser

**Time**: ~1-2 seconds  
**Files Updated**: 1-3 pages  
**Downtime**: Zero  
**Method**: Atomic file replacement

---

### Strategy 2: Full Rebuild (5% of Updates)

**Trigger**: Layout, template, or global config changes

**Process**:
1. Admin edits `_layouts.json`
2. Daemon detects global change
3. Spawns: `npm run cms-regen-site`
4. Worker builds entire site to: `dist-builds/build-1234567890/`
5. Worker atomically updates symlink: `dist/ → build-1234567890/`
6. Worker cleans up old builds (keeps last 3)
7. Worker exits
8. Daemon refreshes browser

**Time**: ~15-25 seconds  
**Files Updated**: All 50 pages  
**Downtime**: Zero  
**Method**: Blue-green deployment

---

## Directory Structure

### Development Structure
```
webgen-project/
├── build/                      # Build system code
│   ├── watcher.js              # Daemon (cms-watcher)
│   ├── generator.js            # Workers (cms-regen-page/site)
│   ├── dependency-graph.js     # Tracks page dependencies
│   ├── renderer.js             # HTML generation
│   └── utils.js                # Helper functions
│
├── templates/                  # HTML templates (Handlebars/EJS)
│   ├── partials/
│   │   ├── header.hbs
│   │   ├── footer.hbs
│   │   └── navigation.hbs
│   ├── layouts/
│   │   ├── alternating-image.hbs
│   │   ├── hero-banner.hbs
│   │   └── feature-grid.hbs
│   └── pages/
│       ├── hub.hbs
│       └── spoke.hbs
│
├── framework/                  # Config files (unchanged from Phase 1)
│   ├── _site.json
│   ├── _layouts.json
│   ├── _page-templates.json
│   ├── _header-layouts.json
│   ├── _navigation-layouts.json
│   └── _menu.json
│
├── data/en/                    # Content files (unchanged from Phase 1)
│   ├── services.content.json
│   ├── services.page.json
│   ├── hub00/
│   ├── hub01/
│   │   ├── markets.content.json
│   │   ├── markets.page.json
│   │   ├── mlm.content.json
│   │   └── mlm.page.json
│   └── hub02/
│
├── styles/                     # CSS (unchanged)
├── scripts/                    # JS (modified for enhancement)
├── assets/                     # Images/media (unchanged)
│
└── dist/                       # Output directory
    ├── .temp/                  # Temp files for atomic writes
    │   └── *.html.tmp
    └── (generated HTML files)
```

### Production Structure (Blue-Green)
```
webgen-project/
├── dist/                       # Symlink to current build
│   → dist-builds/build-1234567890/
│
├── dist-builds/                # Build history
│   ├── build-1234567890/       # Current (active)
│   │   ├── index.html
│   │   ├── services.html
│   │   ├── hub01/
│   │   │   ├── markets.html
│   │   │   └── mlm.html
│   │   ├── styles/
│   │   ├── scripts/
│   │   └── assets/
│   ├── build-1234567850/       # Previous (for rollback)
│   └── build-1234567800/       # Older (cleanup candidate)
│
└── (rest of project structure)
```

---

## User Workflows

### SME Content Editor (95% of Time)

**Morning Setup** (One-time, by Developer/Admin):
```bash
$ npm run dev
[CMS Watcher] Active - monitoring for changes
```

**All Day Workflow** (SME):
1. Open VS Code
2. Edit `mlm.content.json`
3. Press `Ctrl+S` (save)
4. **[Automatic]** Daemon detects change
5. **[Automatic]** Worker rebuilds `mlm.html`
6. **[Automatic]** Browser refreshes
7. SME sees changes immediately

**SME Never Touches**:
- ❌ Terminal/command line
- ❌ npm commands
- ❌ Build system

**SME Only Does**:
- ✅ Edit JSON files
- ✅ Save files
- ✅ View browser

---

### Admin/Developer (5% of Time)

**Layout/Template Changes**:
1. Edit `_layouts.json`
2. Press `Ctrl+S` (save)
3. **[Automatic]** Daemon detects global change
4. **[Automatic]** Worker rebuilds all 50 pages
5. **[Automatic]** Browser refreshes
6. Admin sees changes across entire site

**Manual Full Build** (optional):
```bash
$ npm run build
[CMS Site Regen] Starting full rebuild...
✓ Build complete (50 pages in 14.8s)
```

**Manual Page Build** (optional):
```bash
$ npm run cms-regen-page -- --file="data/en/hub01/mlm.content.json"
[CMS Page Regen] Processing: mlm.content.json
✓ Build complete (1 page in 1.0s)
```

---

### Deployment Workflow (CI/CD)

**Local Testing** → **Git Commit** → **Automated Deploy**

#### Local Testing
```bash
# Developer working locally
$ npm run dev
[CMS Watcher] Active - monitoring for changes

# Make changes, test in browser
# All changes auto-rebuild and refresh
```

#### Git Commit
```bash
# When ready to publish
$ git add data/en/hub01/mlm.content.json
$ git commit -m "Update MLM overview text"
$ git push origin main
```

#### Automated Deploy (GitHub Actions Example)
```yaml
# .github/workflows/deploy.yml
name: Build and Deploy WebGen

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build site
        run: npm run build
      
      - name: Deploy to hosting
        run: |
          # Option 1: Copy to web server
          rsync -avz dist/ user@server:/var/www/html/
          
          # Option 2: Deploy to S3/CDN
          aws s3 sync dist/ s3://my-bucket/ --delete
          
          # Option 3: Deploy to Netlify/Vercel
          netlify deploy --prod --dir=dist
      
      - name: Notify team
        run: |
          echo "Deployment complete!"
          # Send Slack notification, etc.
```

**Deploy Time**: 2-5 minutes (depends on hosting)

---

## Read-Consistency Solution

### Problem Addressed
Users browsing the site while updates are being deployed could experience:
- Partial file reads (corrupted HTML)
- Cross-page inconsistencies
- Missing files (404 errors)
- Broken references

### Solution: Atomic Operations

#### For Single-Page Updates
**Atomic File Replacement**:
```javascript
// Write to temp file
fs.writeFileSync('dist/.temp/mlm.html.tmp', html);

// Atomic rename (instant replacement)
fs.renameSync('dist/.temp/mlm.html.tmp', 'dist/mlm.html');
```

**Result**: Users see either complete old file OR complete new file (never partial)

#### For Full-Site Updates
**Blue-Green Deployment**:
```javascript
// Build to new directory
buildSiteTo('dist-builds/build-1234567890/');

// Atomic symlink swap
fs.renameSync('dist-next', 'dist'); // Points to new build
```

**Result**: All 50 pages switch simultaneously (no inconsistency)

### Additional Safeguards

**Build Lock** (prevents simultaneous builds):
```javascript
// Only one build at a time
if (fs.existsSync('dist/.build.lock')) {
  throw new Error('Build already in progress');
}
```

**Debounce** (prevents cascade of rebuilds):
```javascript
// Wait 500ms for more changes before building
clearTimeout(debounceTimer);
debounceTimer = setTimeout(() => build(), 500);
```

---

## Performance Characteristics

### Build Times

| Scenario | Pages Affected | Build Time | Method |
|----------|----------------|------------|--------|
| Content update | 1-3 pages | 1-2 seconds | Atomic file replace |
| Page config update | 1 page | 1-2 seconds | Atomic file replace |
| Layout update | All 50 pages | 15-25 seconds | Blue-green deploy |
| Template update | All 50 pages | 15-25 seconds | Blue-green deploy |
| Menu update | All 50 pages | 15-25 seconds | Blue-green deploy |
| CSS update | 0 pages | <1 second | File copy only |

### End-User Performance (vs. Current SPA)

| Metric | Current SPA | Hybrid | Improvement |
|--------|-------------|--------|-------------|
| First page load (cold) | 530ms | 120ms | **77% faster** |
| First page load (cached) | 530ms | 20ms | **96% faster** |
| Navigation (same session) | 30ms | 35ms | Comparable |
| SEO score | 3/10 | 10/10 | **Perfect** |
| Mobile performance | 5/10 | 9/10 | **80% better** |
| Works offline | ❌ No | ✅ Yes | **New capability** |

---

## Implementation Plan

### Phase 1A: Core Build System (Week 1-2)

**Deliverables**:
- [ ] File watcher daemon (`build/watcher.js`)
- [ ] Page generator with atomic writes (`build/generator.js`)
- [ ] Dependency graph tracker (`build/dependency-graph.js`)
- [ ] HTML renderer with templates (`build/renderer.js`)
- [ ] NPM scripts configuration (`package.json`)

**Testing**:
- [ ] Test single-page rebuild
- [ ] Test full-site rebuild
- [ ] Verify atomic file operations
- [ ] Validate HTML output matches current rendering

**Acceptance Criteria**:
- ✅ `npm run cms-watcher` starts and monitors files
- ✅ Content change rebuilds 1 page in <2 seconds
- ✅ Layout change rebuilds all pages in <30 seconds
- ✅ No corrupted files during build
- ✅ Browser auto-refreshes after build

---

### Phase 1B: Templates & Full Coverage (Week 3)

**Deliverables**:
- [ ] Create Handlebars/EJS templates for all layouts
- [ ] Implement all page patterns (hub, spoke, alternating, etc.)
- [ ] Add partial templates (header, footer, nav)
- [ ] Generate all existing pages
- [ ] Copy assets (styles, scripts, images)

**Testing**:
- [ ] Visual comparison: generated HTML vs. current SPA
- [ ] Test all page types (hub, spoke, services, etc.)
- [ ] Verify all layouts render correctly
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing

**Acceptance Criteria**:
- ✅ All 50 pages generate successfully
- ✅ Visual appearance matches current site
- ✅ All links and navigation work
- ✅ Images and assets load correctly
- ✅ No console errors

---

### Phase 1C: Progressive Enhancement (Week 4)

**Deliverables**:
- [ ] Optional JavaScript for SPA-style navigation
- [ ] Client-side page transitions
- [ ] Browser history management
- [ ] Fallback behavior (works without JS)
- [ ] Performance optimization

**Testing**:
- [ ] Test with JavaScript enabled
- [ ] Test with JavaScript disabled
- [ ] Test on slow connections
- [ ] Test browser back/forward buttons
- [ ] Performance benchmarking

**Acceptance Criteria**:
- ✅ Site works perfectly without JavaScript
- ✅ Enhanced experience with JavaScript
- ✅ Navigation feels smooth (no full-page flashes)
- ✅ First page load <150ms
- ✅ Passes Core Web Vitals

---

### Phase 1D: CI/CD & Deployment (Week 5)

**Deliverables**:
- [ ] GitHub Actions workflow
- [ ] Blue-green deployment setup
- [ ] Rollback mechanism
- [ ] Health check endpoint
- [ ] Deployment documentation

**Testing**:
- [ ] Test automated deployment pipeline
- [ ] Test rollback to previous build
- [ ] Test zero-downtime deployment
- [ ] Load testing (simulate user traffic during deploy)
- [ ] Monitoring and alerting

**Acceptance Criteria**:
- ✅ `git push` triggers automatic build and deploy
- ✅ Deployment completes in <5 minutes
- ✅ Zero downtime during deployment
- ✅ Can rollback to previous build in <1 minute
- ✅ Alerts on build failures

---

## Technology Stack

### Required Dependencies

```json
{
  "dependencies": {
    "handlebars": "^4.7.7",
    "chokidar": "^3.5.3",
    "browser-sync": "^2.29.3",
    "marked": "^9.0.0"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "eslint": "^8.50.0"
  }
}
```

### Template Engine Choice
**Handlebars** (Recommended)
- ✅ Simple syntax
- ✅ Logic-less templates
- ✅ Great for HTML generation
- ✅ Supports partials and helpers

**Alternative**: EJS (if team prefers embedded JavaScript)

### File Watching
**chokidar** (Industry standard)
- ✅ Cross-platform
- ✅ Fast and reliable
- ✅ Handles edge cases (rapid changes, renames, etc.)

### Browser Refresh
**browser-sync** (Development tool)
- ✅ Live reload
- ✅ Synchronized browsing
- ✅ Mobile testing support

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Template rendering bugs | Medium | Medium | Extensive testing, visual comparison |
| File system race conditions | Low | High | Atomic operations, build locks |
| Performance degradation | Low | Medium | Benchmarking, optimization |
| Symlink support on Windows | Medium | Low | Fallback to directory copy |
| Build failures during deploy | Low | High | Automated tests, rollback mechanism |

### Organizational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SME resistance to new workflow | Low | Medium | Workflow is nearly identical to current |
| Developer learning curve | Medium | Low | Good documentation, training session |
| Increased build time frustration | Low | Medium | Watch mode makes incremental builds fast |
| Deployment complexity | Low | Low | Automated CI/CD, clear documentation |

---

## Success Metrics

### Technical KPIs

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| First page load (cold) | 530ms | <150ms | Lighthouse, WebPageTest |
| First page load (cached) | 530ms | <50ms | Lighthouse, WebPageTest |
| SEO score | 3/10 | 10/10 | Google Search Console |
| Mobile performance | 5/10 | 9/10 | Lighthouse mobile audit |
| Build time (content change) | N/A | <2s | Internal logging |
| Build time (full site) | N/A | <30s | Internal logging |
| Deployment time | Manual | <5min | CI/CD logs |

### User Experience KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to interactive | <2s | Lighthouse TTI |
| Cumulative Layout Shift | <0.1 | Core Web Vitals |
| First Contentful Paint | <1.5s | Core Web Vitals |
| Largest Contentful Paint | <2.5s | Core Web Vitals |

### Business KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| SME content update time | <5min | User feedback |
| Developer deployment time | <5min | CI/CD logs |
| Page edit-to-publish time | <3min | End-to-end timing |
| Zero-downtime deploys | 100% | Uptime monitoring |

---

## Rollback Plan

### If Build System Has Issues

**Option 1**: Keep runtime renderer as fallback
```html
<!-- In generated HTML -->
<script>
  if (!document.querySelector('main').children.length) {
    // Fall back to runtime rendering
    import('./scripts/legacy-renderer.js');
  }
</script>
```

**Option 2**: Revert to previous build
```bash
# Update symlink to previous build
ln -sfn dist-builds/build-1234567850 dist
```

**Option 3**: Deploy legacy SPA
```bash
# Temporarily serve old SPA version
git checkout legacy-spa-branch
# Deploy as before
```

---

## Next Steps

### Immediate Actions (This Week)

1. **Approve Architecture** ✅
   - Review this document
   - Get stakeholder sign-off
   - Schedule kickoff meeting

2. **Setup Development Environment**
   - [ ] Create `build/` directory
   - [ ] Install dependencies (`npm install`)
   - [ ] Setup version control (git branch)

3. **Create Proof of Concept**
   - [ ] Build one simple page (services.html)
   - [ ] Test atomic file replacement
   - [ ] Validate output matches current rendering

4. **Plan Detailed Schedule**
   - [ ] Assign developers to tasks
   - [ ] Set milestone dates
   - [ ] Schedule review checkpoints

### Week 1-2 Deliverables

- [ ] File watcher daemon functional
- [ ] Single-page build working
- [ ] Full-site build working
- [ ] Basic templates created
- [ ] Test with 2-3 pages

### Week 3-4 Deliverables

- [ ] All 50 pages generating
- [ ] Visual QA complete
- [ ] Progressive enhancement added
- [ ] Performance benchmarked

### Week 5 Deliverables

- [ ] CI/CD pipeline configured
- [ ] Blue-green deployment working
- [ ] Documentation complete
- [ ] Training completed
- [ ] Production deployment

---

## Training Plan

### For SMEs (1 hour session)

**Topics**:
1. What changed (very little from their perspective)
2. How to start work (open VS Code - watcher auto-starts)
3. Edit → Save → See changes workflow
4. What to do if something breaks (contact admin)

**Outcome**: SMEs confident they can edit content

### For Admins/Developers (2 hour session)

**Topics**:
1. Three-process architecture overview
2. How to start daemon (`npm run dev`)
3. How to do manual builds (`npm run build`)
4. How to debug build issues
5. How to deploy to production
6. How to rollback if needed

**Outcome**: Admins can operate and troubleshoot system

---

## Support & Documentation

### Documentation to Create

1. **README.md** - Quick start guide
2. **ARCHITECTURE.md** - Technical deep dive
3. **WORKFLOWS.md** - User workflows (SME, Admin, Deploy)
4. **TROUBLESHOOTING.md** - Common issues and solutions
5. **API.md** - Build system API reference

### Support Channels

- **Slack channel**: #webgen-support
- **Email**: webgen-support@company.com
- **Documentation site**: docs.webgen.company.com
- **Emergency contact**: Admin on-call rotation

---

## Budget Estimate

### Development Time

| Phase | Duration | Developer Days | Cost Estimate |
|-------|----------|----------------|---------------|
| Phase 1A: Core Build | 2 weeks | 10 days | $8,000 - $12,000 |
| Phase 1B: Templates | 1 week | 5 days | $4,000 - $6,000 |
| Phase 1C: Enhancement | 1 week | 5 days | $4,000 - $6,000 |
| Phase 1D: CI/CD | 1 week | 5 days | $4,000 - $6,000 |
| **Total** | **5 weeks** | **25 days** | **$20,000 - $30,000** |

### Infrastructure Costs

| Item | One-Time | Monthly | Annual |
|------|----------|---------|--------|
| CI/CD (GitHub Actions) | $0 | $0 | $0 (free tier) |
| Additional storage | $0 | $5 | $60 |
| Monitoring tools | $0 | $0 | $0 (free tier) |
| **Total** | **$0** | **$5** | **$60** |

**ROI**: Performance improvements lead to better SEO rankings and user engagement, paying back investment in <1 month.

---

## Conclusion

The Hybrid rendering approach provides:

✅ **77% faster** page loads for end users  
✅ **Perfect SEO** (10/10 score)  
✅ **Zero-risk** for SME content editors (identical workflow)  
✅ **Zero-downtime** deployments  
✅ **Smart builds** (fast incremental, safe full rebuilds)  
✅ **Future-proof** architecture (progressive enhancement)  

**Investment**: 5 weeks, $20-30K  
**Return**: Better UX, higher SEO rankings, lower operational costs  
**Risk**: Low (can rollback to legacy SPA if needed)

---

## Approval Sign-Off

**Approved By**:
- [ ] Technical Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
- [ ] DevOps Lead: __________________ Date: _______

**Next Meeting**: Kickoff scheduled for: _________________
