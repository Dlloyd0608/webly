# WebGen Templates - Complete Set

All Handlebars templates for the build system.

---

## templates/partials/header.hbs

```handlebars
{{! Standard page header with title and subtitle}}
{{#if title}}
<div class="page-header-meta">
    <h1 class="page-main-title">{{escapeHtml title}}</h1>
    {{#if subtitle}}
    <p class="page-sub-title">{{escapeHtml subtitle}}</p>
    {{/if}}
    <div class="divider-line"></div>
</div>
{{/if}}
```

---

## templates/partials/navigation.hbs

```handlebars
{{! Secondary navigation bar (tabs)}}
{{#if items}}
<div class="sibling-nav-block">
    {{#each items}}
    <a href="/{{href}}" class="sibling-nav-item {{#if isHub}}nav-hub-link{{else}}nav-spoke-link{{/if}} {{#if isActive}}active{{/if}}" data-target-id="{{id}}">
        {{label}}
    </a>
    {{/each}}
</div>
{{/if}}
```

---

## templates/partials/footer.hbs

```handlebars
{{! Footer content (currently rendered in main page.hbs)}}
```

---

## templates/layouts/alternating-image.hbs

```handlebars
{{! Alternating image and text section}}
<section class="static-section {{#if (eq imageSide 'left')}}image-left{{else}}image-right{{/if}} split-{{split}}">
    <div class="media-container">
        {{#if content.media}}
        <div class="image-container">
            <img src="{{mediaPath content.media.src}}" alt="{{escapeHtml content.media.alt}}">
        </div>
        {{/if}}
    </div>
    <div class="static-text-container">
        {{#if content.title}}
        <h2>{{escapeHtml content.title}}</h2>
        {{/if}}
        
        {{#if content.paragraph}}
        <p>{{{markdown content.paragraph}}}</p>
        {{/if}}
        
        {{#if content.listItems}}
        <ul>
            {{#each content.listItems}}
            <li>{{{markdown this}}}</li>
            {{/each}}
        </ul>
        {{/if}}
        
        {{#if content.callToAction}}
        <p class="read-more-wrapper">
            <a href="/{{linkPath content.callToAction.targetId}}" class="read-more-link">
                {{content.callToAction.text}} &gt;
            </a>
        </p>
        {{/if}}
    </div>
</section>
```

---

## templates/layouts/feature-grid.hbs

```handlebars
{{! Feature grid section with multiple panels}}
<section class="static-section feature-list-section">
    {{#if content.title}}
    <h2 class="section-title">{{escapeHtml content.title}}</h2>
    {{/if}}
    
    <div class="feature-panel-container columns-{{columns}}">
        {{#each content.panels}}
        <div class="feature-panel">
            <div class="feature-panel-header">
                {{#if iconSrc}}
                <img src="{{mediaPath iconSrc}}" class="feature-icon" alt="{{title}} icon">
                {{/if}}
                <h2>{{escapeHtml title}}</h2>
            </div>
            <ul>
                {{#each listItems}}
                <li>{{{markdown this}}}</li>
                {{/each}}
            </ul>
        </div>
        {{/each}}
    </div>
</section>
```

---

## templates/layouts/text-block.hbs

```handlebars
{{! Simple text block section}}
<div class="description-box">
    {{#if content.title}}
    <h2 class="section-title">{{escapeHtml content.title}}</h2>
    {{/if}}
    
    {{#if content.paragraph}}
    <p>{{{markdown content.paragraph}}}</p>
    {{/if}}
    
    {{#if content.content}}
    <div class="text-content">
        {{{markdown content.content}}}
    </div>
    {{/if}}
</div>
```

---

## templates/layouts/form.hbs

```handlebars
{{! Contact or data collection form}}
<div class="form-container">
    {{#if content.title}}
    <h2 class="form-title">{{escapeHtml content.title}}</h2>
    {{/if}}
    
    <form action="#" method="POST" class="ips-form">
        <p class="form-note">Fields marked (required) are necessary.</p>
        
        {{#each content.fields}}
        <div class="form-group {{size}}">
            {{#if label}}
            <label for="{{name}}">{{escapeHtml label}}</label>
            {{/if}}
            
            {{#if (eq type 'textarea')}}
            <textarea id="{{name}}" name="{{name}}" {{#if required}}required{{/if}}></textarea>
            {{else}}
            <input id="{{name}}" name="{{name}}" type="{{type}}" {{#if required}}required{{/if}}>
            {{/if}}
        </div>
        {{/each}}
        
        {{#if content.submitButtonLabel}}
        <div class="form-group full form-submit-container">
            <button type="submit" class="ips-button form-submit-button">
                {{escapeHtml content.submitButtonLabel}}
            </button>
        </div>
        {{/if}}
    </form>
</div>
```

---

## templates/layouts/hero-banner.hbs

```handlebars
{{! Hero banner with image and centered text}}
<section class="static-section hero-overlay">
    <div class="media-container">
        {{#if content.media}}
        <img src="{{mediaPath content.media.src}}" alt="{{escapeHtml content.media.alt}}">
        {{/if}}
    </div>
    <div class="static-text-container">
        {{#if content.title}}
        <h2>{{escapeHtml content.title}}</h2>
        {{/if}}
        {{#if content.paragraph}}
        <p>{{escapeHtml content.paragraph}}</p>
        {{/if}}
    </div>
</section>
```

---

## templates/header-standard.hbs

```handlebars
{{! Standard page header (called by renderer)}}
<div class="page-header-meta">
    <h1 class="page-main-title">{{escapeHtml title}}</h1>
    {{#if subtitle}}
    <p class="page-sub-title">{{escapeHtml subtitle}}</p>
    {{/if}}
    <div class="divider-line"></div>
</div>
```

---

## templates/nav-tab-bar.hbs

```handlebars
{{! Tab-style navigation bar (sibling or hub sections)}}
{{#if items}}
<div class="sibling-nav-block">
    {{#each items}}
    <a href="/{{href}}" class="sibling-nav-item {{#if isHub}}nav-hub-link{{else}}nav-spoke-link{{/if}} {{#if isActive}}active{{/if}}">
        {{label}}
    </a>
    {{/each}}
</div>
{{/if}}
```

---

## File Placement

Save these templates in your project:

```
templates/
├── page.hbs                    (Main page wrapper)
├── partials/
│   ├── header.hbs
│   ├── navigation.hbs
│   └── footer.hbs
├── layouts/
│   ├── alternating-image.hbs
│   ├── feature-grid.hbs
│   ├── text-block.hbs
│   ├── form.hbs
│   └── hero-banner.hbs
├── header-standard.hbs
└── nav-tab-bar.hbs
```

---

## Handlebars Helper Registration (in renderer.js)

Already included in `build/renderer.js`:
- `escapeHtml` - Escape HTML entities
- `markdown` - Convert **bold** markdown
- `mediaPath` - Resolve image URLs
- `linkPath` - Resolve internal links
- `json` - Output JSON (for embedded data)
- `eq` - Equality check
- `upper` - Uppercase text

These templates work with your existing CSS and follow your current HTML structure exactly.
