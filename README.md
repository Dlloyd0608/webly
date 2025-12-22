# webly
Static website builder app for multiple projects

## **I. System Overview**
## **II. Data Model & Configuration**
## **III. User Roles & Workflows**
## **IV. Application Modules**
## **V. Build System Architecture**
## **VI. Technology Stack**
## **VII. Migration Path**
## **VIII. Key Features by Phase**

## Documents and Raw files

## Site structure (in-flux)





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
