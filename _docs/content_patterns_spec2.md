# WebGen Phase 1 - Content Patterns Specification (FINAL)

## 📖 Purpose
This document defines ALL permissible content block patterns for the inPowerSuite website based on actual design requirements. **Element-based architecture** for maximum flexibility.

---

## 🎯 Core Architecture: Element-Based Blocks

Every content block is composed of **ORDERED ELEMENTS**:

---json
{
  "blocks": {
    "block-id": {
      "id": "block-id",
      "layout": "split-left",
      "elements": [
        { "type": "title", ... },
        { "type": "paragraph", ... },
        { "type": "list", ... },
        { "type": "media", ... },
        { "type": "callToAction", ... }
      ]
    }
  }
}
---

---

## 🧩 Element Types

### **1. Title Element**
---json
{
  "type": "title",
  "content": "Section Title",
  "level": 1,          // 1=main, 2=subsection, 3=minor
  "style": "standard", // standard, uppercase, centered
  "position": "default" // default, left, right, center
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "title"
content = "Section Title"
level = 1
style = "standard"
---

---

### **2. Paragraph Element**
---json
{
  "type": "paragraph",
  "content": "Text content with **markdown** support",
  "align": "left",     // left, center, right, justify
  "position": "default" // default, left, right (for split layouts)
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "paragraph"
content = "Text content with **markdown** support"
align = "left"
---

---

### **3. List Element**
---json
{
  "type": "list",
  "title": "Optional list title",  // NEW: Title for this specific list
  "style": "bullets",              // bullets, checkbox, checkmark, numbered
  "items": [
    "First item",
    "Second item with **bold**",
    "Third item"
  ],
  "position": "default"             // default, left, right (for split layouts)
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "list"
title = "Features"  # Optional title for this list
style = "bullets"
items = [
    "First item",
    "Second item with **bold**",
    "Third item"
]
---

---

### **4. Media Element**
---json
{
  "type": "media",
  "mediaType": "image",     // image, carousel, video, icon
  "src": "filename.jpg",    // string or array for carousel
  "alt": "Description",
  "caption": "Optional caption",
  "position": "left",       // left, right, top, bottom, center
  "size": "standard"        // standard, large, small, full-width
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "media"
mediaType = "image"
src = "filename.jpg"
alt = "Description"
position = "left"
size = "standard"
---

**Carousel Example:**
---toml
[[blocks.example.elements]]
type = "media"
mediaType = "carousel"
src = ["image1.jpg", "image2.jpg", "image3.jpg"]
alt = "Product screenshots"
captions = ["Step 1", "Step 2", "Step 3"]
---

---

### **5. Call-to-Action Element**
---json
{
  "type": "callToAction",
  "text": "Learn More",
  "targetId": "features",   // Internal link
  "url": "",                // OR external URL
  "style": "primary",       // primary, secondary, link, outline
  "position": "inline",     // inline, block, left, right, center
  "newWindow": false        // For external URLs
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "callToAction"
text = "Learn More"
targetId = "features"
style = "primary"
position = "inline"
---

---

### **6. Form Element** (NEW)
---json
{
  "type": "form",
  "title": "Contact Us",
  "description": "Fill out the form below",
  "layout": "2-up",         // 1-up, 2-up
  "fields": [
    {
      "name": "name",
      "label": "Your Name (required)",
      "type": "text",
      "required": true,
      "size": "half",       // full, half
      "placeholder": "John Doe"
    },
    {
      "name": "email",
      "label": "Email (required)",
      "type": "email",
      "required": true,
      "size": "half"
    },
    {
      "name": "message",
      "label": "Message",
      "type": "textarea",
      "required": false,
      "size": "full",
      "rows": 5
    }
  ],
  "submitButton": {
    "text": "Send Message",
    "style": "primary"
  },
  "successMessage": "Thank you! We'll be in touch soon."
}
---

**TOML:**
---toml
[[blocks.contact.elements]]
type = "form"
title = "Contact Us"
description = "Fill out the form below"
layout = "2-up"
successMessage = "Thank you! We'll be in touch soon."

[[blocks.contact.elements.fields]]
name = "name"
label = "Your Name (required)"
type = "text"
required = true
size = "half"
placeholder = "John Doe"

[[blocks.contact.elements.fields]]
name = "email"
label = "Email (required)"
type = "email"
required = true
size = "half"

[[blocks.contact.elements.fields]]
name = "message"
label = "Message"
type = "textarea"
required = false
size = "full"
rows = 5

[blocks.contact.elements.submitButton]
text = "Send Message"
style = "primary"
---

---

### **7. Spacer Element**
---json
{
  "type": "spacer",
  "height": "medium"        // small, medium, large, custom
}
---

**TOML:**
---toml
[[blocks.example.elements]]
type = "spacer"
height = "medium"
---

---

## 🎨 Layout Patterns

### **Pattern 1: Split Layout - Image Left**
---
┌─────────────┬─────────────────────┐
│   IMAGE     │  Title              │
│             │  Paragraph          │
│             │  • List items       │
│             │  [CTA Link]         │
└─────────────┴─────────────────────┘
---

**JSON:**
---json
{
  "id": "mobile-commerce",
  "layout": "split-left",
  "elements": [
    {
      "type": "media",
      "mediaType": "image",
      "src": "165507.jpg",
      "alt": "Mobile Commerce",
      "position": "left"
    },
    {
      "type": "title",
      "content": "Mobile Commerce",
      "level": 1
    },
    {
      "type": "paragraph",
      "content": "We assess your mobile properties and implement cutting-edge strategies."
    },
    {
      "type": "list",
      "style": "bullets",
      "items": [
        "Mobile Assessments",
        "Mobile Solution Design",
        "Hybrid Development"
      ]
    },
    {
      "type": "callToAction",
      "text": "LEARN MORE",
      "targetId": "services"
    }
  ]
}
---

**TOML:**
---toml
[blocks.mobile-commerce]
id = "mobile-commerce"
layout = "split-left"

[[blocks.mobile-commerce.elements]]
type = "media"
mediaType = "image"
src = "165507.jpg"
alt = "Mobile Commerce"
position = "left"

[[blocks.mobile-commerce.elements]]
type = "title"
content = "Mobile Commerce"
level = 1

[[blocks.mobile-commerce.elements]]
type = "paragraph"
content = "We assess your mobile properties and implement cutting-edge strategies."

[[blocks.mobile-commerce.elements]]
type = "list"
style = "bullets"
items = [
    "Mobile Assessments",
    "Mobile Solution Design",
    "Hybrid Development"
]

[[blocks.mobile-commerce.elements]]
type = "callToAction"
text = "LEARN MORE"
targetId = "services"
---

---

### **Pattern 2: Split Layout - Image Right**
---
┌─────────────────────┬─────────────┐
│  Title              │   IMAGE     │
│  Paragraph          │             │
│  • List items       │             │
│  [CTA Link]         │             │
└─────────────────────┴─────────────┘
---

Same structure as Pattern 1, but -layout = "split-right"- and -media.position = "right"-

---

### **Pattern 3: Multi-Title with Multiple Lists** (NEW)
---
┌─────────────┬─────────────────────┐
│   IMAGE     │  Main Title         │
│             │  Intro paragraph    │
│             │  ──────────────     │
│             │  List Title 1       │
│             │  • Item             │
│             │  • Item             │
│             │  ──────────────     │
│             │  List Title 2       │
│             │  • Item             │
│             │  • Item             │
│             │  [CTA Link]         │
└─────────────┴─────────────────────┘
---

**JSON:**
---json
{
  "id": "enrollment",
  "layout": "split-left",
  "elements": [
    {
      "type": "media",
      "mediaType": "carousel",
      "src": ["enroll-1.png", "enroll-2.png", "enroll-3.png"],
      "alt": "Enrollment Process",
      "position": "left"
    },
    {
      "type": "title",
      "content": "Member Enrollment",
      "level": 1
    },
    {
      "type": "paragraph",
      "content": "Comprehensive enrollment module for self-serve and up-line initiated sign-ups."
    },
    {
      "type": "list",
      "title": "Basic Features",
      "style": "checkmark",
      "items": [
        "Custom fields",
        "Sponsor lookup",
        "Multiple products and kits"
      ]
    },
    {
      "type": "list",
      "title": "Advanced Options",
      "style": "checkmark",
      "items": [
        "Flexible payment options",
        "Downloadable terms and conditions",
        "Welcome letter and notifications"
      ]
    },
    {
      "type": "callToAction",
      "text": "SEE DEMO",
      "targetId": "demo"
    }
  ]
}
---

**TOML:**
---toml
[blocks.enrollment]
id = "enrollment"
layout = "split-left"

[[blocks.enrollment.elements]]
type = "media"
mediaType = "carousel"
src = ["enroll-1.png", "enroll-2.png", "enroll-3.png"]
alt = "Enrollment Process"
position = "left"

[[blocks.enrollment.elements]]
type = "title"
content = "Member Enrollment"
level = 1

[[blocks.enrollment.elements]]
type = "paragraph"
content = "Comprehensive enrollment module for self-serve and up-line initiated sign-ups."

[[blocks.enrollment.elements]]
type = "list"
title = "Basic Features"
style = "checkmark"
items = [
    "Custom fields",
    "Sponsor lookup",
    "Multiple products and kits"
]

[[blocks.enrollment.elements]]
type = "list"
title = "Advanced Options"
style = "checkmark"
items = [
    "Flexible payment options",
    "Downloadable terms and conditions",
    "Welcome letter and notifications"
]

[[blocks.enrollment.elements]]
type = "callToAction"
text = "SEE DEMO"
targetId = "demo"
---

---

### **Pattern 4: Stacked Layout - Image Top**
---
┌─────────────────────────────────┐
│           Title                 │
├─────────────────────────────────┤
│          IMAGE/CAROUSEL         │
├─────────────────────────────────┤
│  Paragraph     │  • List items  │
│  Paragraph     │  • List items  │
│  Paragraph     │  • List items  │
├─────────────────────────────────┤
│          [CTA Link]             │
└─────────────────────────────────┘
---

**JSON:**
---json
{
  "id": "product-showcase",
  "layout": "stacked-image-top",
  "elements": [
    {
      "type": "title",
      "content": "Product Features",
      "level": 1
    },
    {
      "type": "media",
      "mediaType": "carousel",
      "src": ["feature1.jpg", "feature2.jpg", "feature3.jpg"],
      "alt": "Product Features"
    },
    {
      "type": "paragraph",
      "content": "First key benefit paragraph."
    },
    {
      "type": "list",
      "style": "bullets",
      "items": ["Feature A", "Feature B", "Feature C"]
    },
    {
      "type": "paragraph",
      "content": "Second key benefit paragraph."
    },
    {
      "type": "list",
      "style": "checkmark",
      "items": ["Capability 1", "Capability 2", "Capability 3"]
    },
    {
      "type": "callToAction",
      "text": "VIEW DETAILS",
      "targetId": "features"
    }
  ]
}
---

---

### **Pattern 5: Stacked Layout - Image Bottom**
---
┌─────────────────────────────────┐
│           Title                 │
├─────────────────────────────────┤
│  Paragraph     │  • List items  │
│  Paragraph     │  • List items  │
│  Paragraph     │  • List items  │
├─────────────────────────────────┤
│          IMAGE/CAROUSEL         │
├─────────────────────────────────┤
│          [CTA Link]             │
└─────────────────────────────────┘
---

Same as Pattern 4, but -layout = "stacked-image-bottom"- and media element comes after content.

---

### **Pattern 6: Complex Split - Mixed Content**
---
┌─────────────┬─────────────────────┐
│             │  Title              │
│   IMAGE     │  ────────────────   │
│             │  Paragraph          │
│             │  Paragraph          │
├─────────────┤  Paragraph          │
│  List Title │  ────────────────   │
│  • Lists    │  List Title         │
│  • Lists    │  • List items       │
│  • Lists    │  • List items       │
│             │  ────────────────   │
│  [CTA]      │  [CTA Link]         │
└─────────────┴─────────────────────┘
---

**JSON:**
---json
{
  "id": "complex-features",
  "layout": "complex-split-left",
  "elements": [
    {
      "type": "title",
      "content": "Comprehensive Platform",
      "level": 1
    },
    {
      "type": "media",
      "mediaType": "image",
      "src": "platform.jpg",
      "alt": "Platform Overview",
      "position": "left"
    },
    {
      "type": "paragraph",
      "content": "First paragraph on right side.",
      "position": "right"
    },
    {
      "type": "paragraph",
      "content": "Second paragraph on right side.",
      "position": "right"
    },
    {
      "type": "paragraph",
      "content": "Third paragraph on right side.",
      "position": "right"
    },
    {
      "type": "list",
      "title": "Left Side Features",
      "style": "bullets",
      "items": ["Feature 1", "Feature 2", "Feature 3"],
      "position": "left"
    },
    {
      "type": "list",
      "title": "Right Side Benefits",
      "style": "checkmark",
      "items": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "position": "right"
    },
    {
      "type": "callToAction",
      "text": "MORE INFO",
      "targetId": "details",
      "position": "left"
    },
    {
      "type": "callToAction",
      "text": "GET STARTED",
      "targetId": "demo",
      "position": "right",
      "style": "primary"
    }
  ]
}
---

---

### **Pattern 7: Grid Layout - 2, 3, or 4 Columns**
---
┌──────────────────────────────────────┐
│            Page Title                │
│         Introduction text            │
├─────────┬─────────┬─────────┬────────┤
│ Title   │ Title   │ Title   │ Title  │
│ Para    │ Para    │ Para    │ Para   │
│ • List  │ • List  │ • List  │ • List │
│ [CTA]   │ [CTA]   │ [CTA]   │ [CTA]  │
└─────────┴─────────┴─────────┴────────┘
---

**JSON:**
---json
{
  "id": "feature-grid",
  "layout": "grid-4-column",
  "elements": [
    {
      "type": "title",
      "content": "Our Solutions",
      "level": 1,
      "position": "header"
    },
    {
      "type": "paragraph",
      "content": "Choose the solution that fits your business needs.",
      "position": "header"
    }
  ],
  "panels": [
    {
      "elements": [
        { "type": "title", "content": "MLM", "level": 2 },
        { "type": "paragraph", "content": "Multi-level marketing tools" },
        { "type": "list", "style": "checkmark", "items": ["Genealogy", "Commissions"] },
        { "type": "callToAction", "text": "Learn More", "targetId": "mlm" }
      ]
    },
    {
      "elements": [
        { "type": "title", "content": "Party Plan", "level": 2 },
        { "type": "paragraph", "content": "Party planning features" },
        { "type": "list", "style": "checkmark", "items": ["Party Management", "Host Rewards"] },
        { "type": "callToAction", "text": "Learn More", "targetId": "partyplan" }
      ]
    },
    {
      "elements": [
        { "type": "title", "content": "B2B", "level": 2 },
        { "type": "paragraph", "content": "Business solutions" },
        { "type": "list", "style": "checkmark", "items": ["Vendor Portal", "Bulk Ordering"] },
        { "type": "callToAction", "text": "Learn More", "targetId": "b2b" }
      ]
    },
    {
      "elements": [
        { "type": "title", "content": "B2C", "level": 2 },
        { "type": "paragraph", "content": "Consumer eCommerce" },
        { "type": "list", "style": "checkmark", "items": ["Shopping Cart", "Checkout"] },
        { "type": "callToAction", "text": "Learn More", "targetId": "b2c" }
      ]
    }
  ]
}
---

**TOML:**
---toml
[blocks.feature-grid]
id = "feature-grid"
layout = "grid-4-column"

[[blocks.feature-grid.elements]]
type = "title"
content = "Our Solutions"
level = 1
position = "header"

[[blocks.feature-grid.elements]]
type = "paragraph"
content = "Choose the solution that fits your business needs."
position = "header"

# Panel 1
[[blocks.feature-grid.panels]]
[[blocks.feature-grid.panels.elements]]
type = "title"
content = "MLM"
level = 2

[[blocks.feature-grid.panels.elements]]
type = "paragraph"
content = "Multi-level marketing tools"

[[blocks.feature-grid.panels.elements]]
type = "list"
style = "checkmark"
items = ["Genealogy", "Commissions"]

[[blocks.feature-grid.panels.elements]]
type = "callToAction"
text = "Learn More"
targetId = "mlm"

# Panel 2
[[blocks.feature-grid.panels]]
[[blocks.feature-grid.panels.elements]]
type = "title"
content = "Party Plan"
level = 2

[[blocks.feature-grid.panels.elements]]
type = "paragraph"
content = "Party planning features"

[[blocks.feature-grid.panels.elements]]
type = "list"
style = "checkmark"
items = ["Party Management", "Host Rewards"]

[[blocks.feature-grid.panels.elements]]
type = "callToAction"
text = "Learn More"
targetId = "partyplan"

# ... (panels 3 and 4 follow same pattern)
---

---

### **Pattern 8: Two-Column with Subtitles**
---
┌──────────────────────────────────────┐
│            Main Title                │
├──────────────────┬───────────────────┤
│   Subtitle 1     │    Subtitle 2     │
├──────────────────┼───────────────────┤
│ List Title       │  Paragraph        │
│ • Lists          │  Paragraph        │
│ • Lists          │  Paragraph        │
│ [CTA]            │  [CTA]            │
├──────────────────┤                   │
│ List Title       │                   │
│ • Lists          │                   │
│ [CTA]            │                   │
└──────────────────┴───────────────────┘
---

**JSON:**
---json
{
  "id": "comparison",
  "layout": "two-column-subtitles",
  "elements": [
    {
      "type": "title",
      "content": "Feature Comparison",
      "level": 1,
      "position": "header"
    }
  ],
  "columns": [
    {
      "subtitle": "Standard Plan",
      "elements": [
        {
          "type": "list",
          "title": "Core Features",
          "style": "checkmark",
          "items": ["Feature A", "Feature B", "Feature C"]
        },
        {
          "type": "callToAction",
          "text": "Choose Standard",
          "targetId": "pricing"
        },
        {
          "type": "list",
          "title": "Add-Ons",
          "style": "bullets",
          "items": ["Add-on 1", "Add-on 2"]
        },
        {
          "type": "callToAction",
          "text": "View Add-Ons",
          "targetId": "addons",
          "style": "secondary"
        }
      ]
    },
    {
      "subtitle": "Enterprise Plan",
      "elements": [
        {
          "type": "paragraph",
          "content": "Our enterprise plan includes everything in Standard plus:"
        },
        {
          "type": "paragraph",
          "content": "Advanced analytics and reporting tools."
        },
        {
          "type": "paragraph",
          "content": "Dedicated support and custom integrations."
        },
        {
          "type": "callToAction",
          "text": "Contact Sales",
          "targetId": "contact",
          "style": "primary"
        }
      ]
    }
  ]
}
---

---

### **Pattern 9: Form Block - 1-up Layout** (NEW)
---
┌─────────────────────────────────┐
│         Contact Us              │
│   Fill out the form below       │
├─────────────────────────────────┤
│ Name (required)                 │
├─────────────────────────────────┤
│ Email (required)                │
├─────────────────────────────────┤
│ Phone                           │
├─────────────────────────────────┤
│ Message                         │
│                                 │
│                                 │
├─────────────────────────────────┤
│      [Send Message]             │
└─────────────────────────────────┘
---

**JSON:**
---json
{
  "id": "contact-form",
  "layout": "form-1-up",
  "elements": [
    {
      "type": "form",
      "title": "Contact Us",
      "description": "Fill out the form below and we'll get back to you within 24 hours.",
      "layout": "1-up",
      "fields": [
        {
          "name": "name",
          "label": "Your Name (required)",
          "type": "text",
          "required": true,
          "size": "full"
        },
        {
          "name": "email",
          "label": "Email Address (required)",
          "type": "email",
          "required": true,
          "size": "full"
        },
        {
          "name": "phone",
          "label": "Phone Number",
          "type": "tel",
          "required": false,
          "size": "full"
        },
        {
          "name": "message",
          "label": "Your Message",
          "type": "textarea",
          "required": false,
          "size": "full",
          "rows": 5
        }
      ],
      "submitButton": {
        "text": "Send Message",
        "style": "primary"
      },
      "successMessage": "Thank you! We'll be in touch soon."
    }
  ]
}
---

**TOML:**
---toml
[blocks.contact-form]
id = "contact-form"
layout = "form-1-up"

[[blocks.contact-form.elements]]
type = "form"
title = "Contact Us"
description = "Fill out the form below and we'll get back to you within 24 hours."
layout = "1-up"
successMessage = "Thank you! We'll be in touch soon."

[[blocks.contact-form.elements.fields]]
name = "name"
label = "Your Name (required)"
type = "text"
required = true
size = "full"

[[blocks.contact-form.elements.fields]]
name = "email"
label = "Email Address (required)"
type = "email"
required = true
size = "full"

[[blocks.contact-form.elements.fields]]
name = "phone"
label = "Phone Number"
type = "tel"
required = false
size = "full"

[[blocks.contact-form.elements.fields]]
name = "message"
label = "Your Message"
type = "textarea"
required = false
size = "full"
rows = 5

[blocks.contact-form.elements.submitButton]
text = "Send Message"
style = "primary"
---

---

### **Pattern 10: Form Block - 2-up Layout** (NEW)
---
┌──────────────────────────────────┐
│         Request a Demo           │
│   We'll contact you shortly      │
├──────────────┬───────────────────┤
│ Name         │ Email             │
├──────────────┼───────────────────┤
│ Company      │ Phone             │
├──────────────┴───────────────────┤
│ Message (full width)             │
│                                  │
├──────────────────────────────────┤
│      [Request Demo]              │
└──────────────────────────────────┘
---

**JSON:**
---json
{
  "id": "demo-form",
  "layout": "form-2-up",
  "elements": [
    {
      "type": "form",
      "title": "Request a Demo",
      "description": "We'll contact you shortly to schedule your personalized demo.",
      "layout": "2-up",
      "fields": [
        {
          "name": "name",
          "label": "Your Name (required)",
          "type": "text",
          "required": true,
          "size": "half"
        },
        {
          "name": "email",
          "label": "Email (required)",
          "type": "email",
          "required": true,
          "size": "half"
        },
        {
          "name": "company",
          "label": "Company Name",
          "type": "text",
          "required": false,
          "size": "half"
        },
        {
          "name": "phone",
          "label": "Phone Number",
          "type": "tel",
          "required": false,
          "size": "half"
        },
        {
          "name": "message",
          "label": "Tell us about your needs",
          "type": "textarea",
          "required": false,
          "size": "full",
          "rows": 4
        }
      ],
      "submitButton": {
        "text": "Request Demo",
        "style": "primary"
      },
      "successMessage": "Demo request received! We'll contact you within 1 business day."
    }
  ]
}
---

**TOML:**
---toml
[blocks.demo-form]
id = "demo-form"
layout = "form-2-up"

[[blocks.demo-form.elements]]
type = "form"
title = "Request a Demo"
description = "We'll contact you shortly to schedule your personalized demo."
layout = "2-up"
successMessage = "Demo request received! We'll contact you within 1 business day."

[[blocks.demo-form.elements.fields]]
name = "name"
label = "Your Name (required)"
type = "text"
required = true
size = "half"

[[blocks.demo-form.elements.fields]]
name = "email"
label = "Email (required)"
type = "email"
required = true
size = "half"

[[blocks.demo-form.elements.fields]]
name = "company"
label = "Company Name"
type = "text"
required = false
size = "half"

[[blocks.demo-form.elements.fields]]
name = "phone"
label = "Phone Number"
type = "tel"
required = false
size = "half"

[[blocks.demo-form.elements.fields]]
name = "message"
label = "Tell us about your needs"
type = "textarea"
required = false
size = "full"
rows = 4

[blocks.demo-form.elements.submitButton]
text = "Request Demo"
style = "primary"
---

