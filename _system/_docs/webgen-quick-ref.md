# Quick Reference: Valid Enums & Values

## 📐 Layout Types

### Single-Column Layouts
| Layout Value | Description | Use Case |
|--------------|-------------|----------|
| `split-left` | Image on left, content on right | Standard feature presentation |
| `split-right` | Content on left, image on right | Alternate feature presentation |
| `stacked-image-top` | Title, then image, then content | Product showcases, visual-first |
| `stacked-image-bottom` | Title, content, then image | Content-first, image as proof |
| `complex-split-left` | Image left with mixed content both sides | Advanced feature comparison |
| `complex-split-right` | Image right with mixed content both sides | Advanced feature comparison |
| `content-only` | Text-only block, no media | Pure content sections |

### Multi-Column Layouts
| Layout Value | Description | Use Case |
|--------------|-------------|----------|
| `grid-2-column` | 2-column grid with header | Feature pairs, comparisons |
| `grid-3-column` | 3-column grid with header | Service offerings, plans |
| `grid-4-column` | 4-column grid with header | Icon grid, feature matrix |
| `two-column-subtitles` | Main title with subtitled columns | Side-by-side comparison |

### Form Layouts
| Layout Value | Description | Use Case |
|--------------|-------------|----------|
| `form-1-up` | Full-width form fields | Contact forms, simple inputs |
| `form-2-up` | Two-column form layout | Demo requests, registrations |

---

## 🎨 Element Styles

### Title Styles
| Style Value | Appearance | Use Case |
|-------------|------------|----------|
| `standard` | Default heading style | Most headings |
| `uppercase` | ALL CAPS heading | Section headers, emphasis |
| `centered` | Center-aligned heading | Hero sections, announcements |

### Title Levels
| Level | Semantic | Visual Size | Use Case |
|-------|----------|-------------|----------|
| `1` | `<h1>` | Largest | Main page/section titles |
| `2` | `<h2>` | Medium | Subsections, panel titles |
| `3` | `<h3>` | Smaller | Minor headings, list titles |

### List Styles
| Style Value | Marker | Description |
|-------------|--------|-------------|
| `bullets` | • | Standard bullet points |
| `checkmark` | ✓ | Green checkmarks (features/benefits) |
| `checkbox` | ☐ | Empty checkboxes (to-do style) |
| `numbered` | 1, 2, 3 | Numbered list (sequential steps) |
| `none` | — | Plain list (no markers) |

### CTA (Call-to-Action) Styles
| Style Value | Appearance | Use Case |
|-------------|------------|----------|
| `primary` | Solid red background, white text | Primary action, high emphasis |
| `secondary` | Red outline, red text | Secondary action |
| `outline` | Gray outline, gray text | Tertiary action |
| `link` | Text link with arrow → | Low-emphasis, inline links |

---

## 📱 Media Types

| Media Type | Description | Source Format | Example |
|------------|-------------|---------------|---------|
| `image` | Single static image | `"filename.jpg"` | `"product.jpg"` |
| `carousel` | Multiple images (slideshow) | `["img1.jpg", "img2.jpg"]` | `["step1.png", "step2.png"]` |
| `video` | Embedded video player | `"https://youtube.com/..."` | YouTube/Vimeo URLs |
| `icon` | Small icon/logo | `"icon.svg"` | `"feature-icon.svg"` |

### Media Sizes
| Size Value | Description | Typical Use |
|------------|-------------|-------------|
| `standard` | Default responsive size | Most images |
| `large` | Larger display | Hero images, showcases |
| `small` | Reduced size | Icons, thumbnails |
| `full-width` | 100% container width | Banners, full-bleed images |

### Media Positions
| Position Value | Layout Compatibility | Description |
|----------------|---------------------|-------------|
| `left` | Split layouts | Image positioned left side |
| `right` | Split layouts | Image positioned right side |
| `top` | Stacked layouts | Image above content |
| `bottom` | Stacked layouts | Image below content |
| `center` | All layouts | Centered image |

---

## 📝 Form Field Types

| Field Type | HTML Input | Validation | Use Case |
|------------|------------|------------|----------|
| `text` | `<input type="text">` | Text only | Name, company, general text |
| `email` | `<input type="email">` | Email format | Email addresses |
| `tel` | `<input type="tel">` | Phone format | Phone numbers |
| `textarea` | `<textarea>` | Multi-line text | Messages, comments |
| `select` | `<select>` | Predefined options | Dropdowns, choices |
| `checkbox` | `<input type="checkbox">` | Boolean | Agreements, opt-ins |
| `radio` | `<input type="radio">` | Single choice from group | Option selection |

### Form Field Sizes
| Size Value | Layout Compatibility | Width |
|------------|---------------------|-------|
| `full` | 1-up and 2-up | 100% width |
| `half` | 2-up only | 50% width (side-by-side) |

### Form Layouts
| Layout Value | Description | Field Arrangement |
|--------------|-------------|-------------------|
| `1-up` | Single column | All fields full-width, stacked |
| `2-up` | Two columns | Half-width fields side-by-side, full-width spans both |

---

## 📍 Position Values

### Element Positions (General)
| Position Value | Layout Context | Description |
|----------------|----------------|-------------|
| `default` | All layouts | Default flow positioning |
| `left` | Split/complex layouts | Force to left column |
| `right` | Split/complex layouts | Force to right column |
| `center` | All layouts | Center-aligned |
| `header` | Grid/column layouts | Top header area |
| `inline` | CTAs in content flow | Inline with surrounding content |
| `block` | CTAs | Full-width block element |

---

## 📏 Spacer Heights

| Height Value | Approximate Size | Use Case |
|--------------|------------------|----------|
| `small` | 20-30px | Subtle spacing between elements |
| `medium` | 40-60px | Standard section spacing |
| `large` | 80-120px | Major section breaks |
| `custom` | User-defined | Requires additional `customHeight` field |

**Custom Height Example:**
```json
{
  "type": "spacer",
  "height": "custom",
  "customHeight": "75px"
}
```

---

## 🎯 Alignment Values

### Paragraph Alignment
| Align Value | Description |
|-------------|-------------|
| `left` | Left-aligned (default) |
| `center` | Center-aligned |
| `right` | Right-aligned |
| `justify` | Justified text |

### Title Position
| Position Value | Description |
|----------------|-------------|
| `default` | Standard positioning |
| `left` | Left-aligned |
| `right` | Right-aligned |
| `center` | Center-aligned |

---

## 🔗 CTA (Call-to-Action) Targeting

### Navigation Types
| Property | Value Type | Description | Example |
|----------|------------|-------------|---------|
| `targetId` | String | Internal block ID for same-page navigation | `"features"` |
| `url` | String | External URL (absolute path) | `"https://example.com"` |
| `newWindow` | Boolean | Open link in new tab (external URLs only) | `true` or `false` |

**Rules:**
- Use **either** `targetId` OR `url`, not both
- `newWindow` only applies to `url` links
- `targetId` performs smooth scroll to block

---

## ✅ Boolean Values

| Field | Type | Values | Default |
|-------|------|--------|---------|
| `required` (form field) | Boolean | `true` / `false` | `false` |
| `newWindow` (CTA) | Boolean | `true` / `false` | `false` |

---

## 🌐 Metadata Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `siteId` | String | ✅ | Unique site identifier | `"inpowersuite"` |
| `contentId` | String | ✅ | Unique content file ID | `"features-content"` |
| `language` | String | ✅ | ISO 639-1 language code | `"en"`, `"es"`, `"fr"` |
| `hub` | String | ✅ | Hub identifier | `"hub02"` |
| `lastUpdated` | String | ✅ | ISO date format | `"2025-11-19"` |
| `author` | String | ❌ | Content author/team | `"Marketing Team"` |

---

## 📋 Complete Validation Checklist

### Block-Level Requirements
- ✅ Unique `id` (lowercase, hyphens, no spaces)
- ✅ Valid `layout` from enum list
- ✅ At least one element in `elements[]`
- ✅ Grid layouts must have `panels[]`
- ✅ Two-column layouts must have `columns[]`

### Element-Level Requirements
- ✅ Every element must have `type`
- ✅ Type must be one of: `title`, `paragraph`, `list`, `media`, `callToAction`, `form`, `spacer`
- ✅ Title: requires `content`, optional `level`, `style`, `position`
- ✅ Paragraph: requires `content`, optional `align`, `position`
- ✅ List: requires `style` + `items[]`, optional `title`, `position`
- ✅ Media: requires `mediaType` + `src` + `alt`, optional `caption`, `position`, `size`
- ✅ CTA: requires `text` + (`targetId` OR `url`), optional `style`, `position`, `newWindow`
- ✅ Form: requires `title` + `fields[]`, optional `description`, `layout`, `submitButton`, `successMessage`
- ✅ Spacer: requires `height`

### Form Field Requirements
- ✅ Every field must have `name`, `label`, `type`
- ✅ `name` must be unique within form
- ✅ `size` must be `"full"` or `"half"`
- ✅ Required fields must have `required: true`
- ✅ Select/Radio fields must have `options[]` array
- ✅ Textarea fields may have `rows` specified

---

## 🚫 Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid layout" | Typo or unsupported layout value | Check enum list above |
| "Missing required field" | Element missing `type`, `content`, etc. | Add required field per element type |
| "Invalid position" | Using `left`/`right` in wrong layout | Only use in split/complex layouts |
| "Duplicate field name" | Two form fields with same `name` | Ensure unique names |
| "Invalid media source" | Wrong format for carousel | Use array `[]` for carousel, string for image |
| "Missing targetId or url" | CTA has neither | Provide one (not both) |

---

## 💡 Best Practices

### Layout Selection
- Use **split layouts** for feature highlighting with visual support
- Use **stacked layouts** for step-by-step processes or visual-heavy content
- Use **grid layouts** for comparing multiple options or services
- Use **form layouts** for lead capture and contact forms

### Style Consistency
- Use `checkmark` lists for benefits/included features
- Use `bullets` for informational lists
- Use `numbered` for sequential steps/processes
- Use `primary` CTA for main conversion action per block
- Use `secondary` or `link` for supporting actions

### Accessibility
- Always provide `alt` text for media
- Use proper heading hierarchy (don't skip levels)
- Mark required form fields with `required: true`
- Provide clear form labels and descriptions

### Performance
- Limit carousels to 3-5 images
- Use appropriate media sizes
- Optimize images before uploading
- Keep form field counts reasonable (under 10 for 1-up, under 12 for 2-up)
