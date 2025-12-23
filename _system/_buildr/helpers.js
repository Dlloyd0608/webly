// ./_system/_build/helpers.js
// Helper functions for the WebGen Phase -1 build system
// Includes utilities for element-based pattern processing

const fs = require('fs');
const path = require('path');

/**
 * Markdown to HTML converter (simple implementation)
 * Supports: **bold**, bullet lists, blockquotes
 */
function markdownToHtml(str) {
  if (typeof str !== 'string') return str;
  
  // Bold
  let html = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet lists (multiline starting with * or -)
  if (html.trim().startsWith('*') || html.trim().startsWith('-')) {
    html = '<ul>' + html.split(/[\r\n]+/).map(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return `<li>${trimmed.substring(2)}</li>`;
      }
      return '';
    }).join('') + '</ul>';
  }
  
  // Blockquotes
  html = html.replace(/&gt; (.*)/g, '<blockquote>$1</blockquote>');
  
  return html;
}

/**
 * Escape HTML entities
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Load JSON file safely
 */
function loadJSON(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filepath}:`, error.message);
    return null;
  }
}

/**
 * Write file atomically (prevents partial writes)
 */
function writeFileAtomic(filepath, content) {
  const dir = path.dirname(filepath);
  const tempPath = path.join(dir, '.temp', path.basename(filepath) + '.tmp');
  
  // Ensure directories exist
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
  
  // Write to temp
  fs.writeFileSync(tempPath, content, 'utf8');
  
  // Atomic rename
  fs.renameSync(tempPath, filepath);
}

/**
 * Resolve media path (CDN or local fallback)
 * @param {string} src - Image filename or URL
 * @param {string} basePath - CDN base URL
 * @param {string} fallbackPath - Local assets path
 * @returns {string} - Full URL or path
 */
function resolveMediaPath(src, basePath, fallbackPath) {
  if (!src) return '';
  
  // Already full URL
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Local absolute path
  if (src.startsWith('/')) {
    return src;
  }
  
  // Check if local file exists (for development)
  const localPath = path.join(process.cwd(), 'assets', src);
  if (fs.existsSync(localPath)) {
    return fallbackPath + src;
  }
  
  // Use remote CDN path
  return basePath + src;
}

/**
 * Resolve internal page link
 * @param {string} targetId - Page identifier
 * @returns {string} - Page URL
 */
function resolveLinkPath(targetId) {
  if (!targetId) return '#';
  
  // SPECIAL CASE: home page is index.html at root
  if (targetId === 'home') {
    return '/';
  }
  
  return `/${targetId}.html`;
}

/**
 * Sort elements by position attribute (for complex split layouts)
 * @param {Array} elements - Array of element objects
 * @returns {Object} - {left: [], right: [], header: []}
 */
function sortElementsByPosition(elements) {
  const sorted = {
    header: [],
    left: [],
    right: []
  };
  
  if (!Array.isArray(elements)) return sorted;
  
  elements.forEach(element => {
    const position = element.position || 'right'; // Default to right if not specified
    if (sorted[position]) {
      sorted[position].push(element);
    } else {
      // If position is not recognized, default to right
      sorted.right.push(element);
    }
  });
  
  return sorted;
}

/**
 * Get grid column class based on column count
 * @param {number} columns - Number of columns (1-4)
 * @returns {string} - CSS class name
 */
function getGridColumnClass(columns) {
  const validColumns = [1, 2, 3, 4];
  const columnCount = validColumns.includes(columns) ? columns : 2;
  return `columns-${columnCount}`;
}

/**
 * Get split ratio class
 * @param {string} split - Split ratio (e.g., "30-70", "50-50")
 * @returns {string} - CSS class name
 */
function getSplitClass(split) {
  const validSplits = ['30-70', '40-60', '50-50', '60-40', '70-30'];
  const splitValue = validSplits.includes(split) ? split : '50-50';
  return `split-${splitValue}`;
}

/**
 * Get image side class
 * @param {string} side - Image position ("left" or "right")
 * @returns {string} - CSS class name
 */
function getImageSideClass(side) {
  return side === 'left' ? 'image-left' : 'image-right';
}

/**
 * Get form field size class
 * @param {string} size - Field size ("half" or "full")
 * @returns {string} - CSS class name
 */
function getFormSizeClass(size) {
  return size === 'half' ? 'half' : 'full';
}

/**
 * Build carousel HTML from media element
 * @param {Object} media - Media element object
 * @param {string} altText - Alt text for images
 * @param {string} basePath - CDN base path
 * @returns {string} - Carousel HTML
 */
function buildCarouselHtml(media, altText, basePath) {
  if (!media || !media.src || !Array.isArray(media.src)) {
    return '<div class="placeholder-media">Carousel data missing</div>';
  }
  
  const images = media.src;
  const captions = media.captions || [];
  
  // Build carousel items
  const itemsHtml = images.map((src, index) => {
    const imageUrl = resolveMediaPath(src, basePath, '/assets/');
    const isActive = index === 0 ? 'active' : '';
    return `
      <div class="carousel-item ${isActive}">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)} - Slide ${index + 1}">
      </div>
    `;
  }).join('');
  
  // Build indicator dots
  const dotsHtml = images.map((_, index) => {
    const isActive = index === 0 ? 'active' : '';
    return `<span class="carousel-dot ${isActive}" data-slide-index="${index}"></span>`;
  }).join('');
  
  return `
    <div class="carousel-container" data-asset-count="${images.length}">
      <div class="carousel-track">
        ${itemsHtml}
      </div>
      <button class="carousel-control prev" aria-label="Previous Slide">‹</button>
      <button class="carousel-control next" aria-label="Next Slide">›</button>
      <div class="carousel-dots-container">
        ${dotsHtml}
      </div>
    </div>
  `;
}

/**
 * Build single image HTML from media element
 * @param {Object} media - Media element object
 * @param {string} altText - Alt text for image
 * @param {string} basePath - CDN base path
 * @returns {string} - Image HTML
 */
function buildImageHtml(media, altText, basePath) {
  if (!media || !media.src) {
    return '<div class="placeholder-media">Image data missing</div>';
  }
  
  const src = Array.isArray(media.src) ? media.src[0] : media.src;
  const imageUrl = resolveMediaPath(src, basePath, '/assets/');
  
  return `
    <div class="image-container">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)}">
    </div>
  `;
}

/**
 * Render a media element (image or carousel)
 * @param {Object} element - Media element object
 * @param {string} basePath - CDN base path
 * @returns {string} - Media HTML
 */
function renderMediaElement(element, basePath) {
  if (!element || element.type !== 'media') return '';
  
  const mediaType = element.mediaType || 'image';
  const altText = element.alt || 'Image';
  
  if (mediaType === 'carousel') {
    return buildCarouselHtml(element, altText, basePath);
  } else if (mediaType === 'image') {
    return buildImageHtml(element, altText, basePath);
  }
  
  return '<div class="placeholder-media">Unsupported media type</div>';
}

/**
 * Render a title element
 * @param {Object} element - Title element object
 * @returns {string} - Title HTML
 */
function renderTitleElement(element) {
  if (!element || element.type !== 'title') return '';
  
  const level = element.level || 2;
  const content = escapeHtml(element.content || '');
  
  return `<h${level}>${content}</h${level}>`;
}

/**
 * Render a paragraph element
 * @param {Object} element - Paragraph element object
 * @returns {string} - Paragraph HTML
 */
function renderParagraphElement(element) {
  if (!element || element.type !== 'paragraph') return '';
  
  const content = markdownToHtml(element.content || '');
  
  return `<p>${content}</p>`;
}

/**
 * Render a list element
 * @param {Object} element - List element object
 * @returns {string} - List HTML
 */
function renderListElement(element) {
  if (!element || element.type !== 'list') return '';
  
  const style = element.style || 'bullets';
  const items = element.items || [];
  const title = element.title ? `<h3>${escapeHtml(element.title)}</h3>` : '';
  
  // Map list style to CSS class and HTML tag
  const listTypeMap = {
    'bullets': { tag: 'ul', class: 'list-bullets' },
    'checkmark': { tag: 'ul', class: 'list-checkmark' },
    'numbered': { tag: 'ol', class: 'list-numbered' },
    'checkbox': { tag: 'ul', class: 'list-checkbox' }
  };
  
  const listType = listTypeMap[style] || listTypeMap['bullets'];
  const itemsHtml = items.map(item => `<li>${markdownToHtml(item)}</li>`).join('');
  
  return `
    ${title}
    <${listType.tag} class="${listType.class}">
      ${itemsHtml}
    </${listType.tag}>
  `;
}

/**
 * Render a call-to-action element
 * @param {Object} element - CTA element object
 * @returns {string} - CTA HTML
 */
function renderCallToActionElement(element) {
  if (!element || element.type !== 'callToAction') return '';
  
  const text = escapeHtml(element.text || 'Learn More');
  const targetId = element.targetId || null;
  const url = element.url || null;
  const style = element.style || 'primary';
  
  const href = targetId ? resolveLinkPath(targetId) : (url || '#');
  const styleClass = `cta-${style}`;
  
  return `
    <p class="read-more-wrapper">
      <a href="${escapeHtml(href)}" class="read-more-link ${styleClass}">
        ${text} &gt;
      </a>
    </p>
  `;
}

/**
 * Render a spacer element
 * @param {Object} element - Spacer element object
 * @returns {string} - Spacer HTML
 */
function renderSpacerElement(element) {
  if (!element || element.type !== 'spacer') return '';
  
  const height = element.height || 'medium';
  const heightMap = {
    'small': '20px',
    'medium': '40px',
    'large': '60px'
  };
  
  const heightValue = heightMap[height] || heightMap['medium'];
  
  return `<div class="spacer" style="height: ${heightValue};"></div>`;
}

/**
 * Validate element structure
 * @param {Object} element - Element object
 * @param {Object} config - Build configuration
 * @returns {Object} - {valid: boolean, errors: []}
 */
function validateElement(element, config) {
  const errors = [];
  
  if (!element || typeof element !== 'object') {
    errors.push('Element is not an object');
    return { valid: false, errors };
  }
  
  if (!element.type) {
    errors.push('Element missing required "type" field');
    return { valid: false, errors };
  }
  
  const elementTypeConfig = config.elementTypes[element.type];
  
  if (!elementTypeConfig) {
    errors.push(`Unknown element type: ${element.type}`);
    return { valid: false, errors };
  }
  
  // Check required fields
  if (elementTypeConfig.requiredFields) {
    elementTypeConfig.requiredFields.forEach(field => {
      if (!element[field]) {
        errors.push(`Element type "${element.type}" missing required field: ${field}`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Deep clone an object (for safe manipulation)
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a file exists
 */
function fileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch (error) {
    return false;
  }
}

/**
 * Get file extension
 */
function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Ensure directory exists (create if needed)
 */
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  // Core utilities
  markdownToHtml,
  escapeHtml,
  loadJSON,
  writeFileAtomic,
  
  // Path resolution
  resolveMediaPath,
  resolveLinkPath,
  
  // Element processing
  sortElementsByPosition,
  renderMediaElement,
  renderTitleElement,
  renderParagraphElement,
  renderListElement,
  renderCallToActionElement,
  renderSpacerElement,
  validateElement,
  
  // CSS class helpers
  getGridColumnClass,
  getSplitClass,
  getImageSideClass,
  getFormSizeClass,
  
  // Carousel helpers
  buildCarouselHtml,
  buildImageHtml,
  
  // File system utilities
  deepClone,
  fileExists,
  getFileExtension,
  ensureDirectory
};
