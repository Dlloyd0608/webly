// ./_buildr/handlebars-helpers.js
// Handlebars helper registration for WebGen Phase -1
// Exposes helper functions to Handlebars templates

const Handlebars = require('handlebars');
const helpers = require('./helpers');

/**
 * Register all Handlebars helpers
 * @param {Object} buildConfig - Build configuration object
 * @param {string} mediaBasePath - CDN base path for media
 * @param {string} mediaFallbackPath - Local fallback path
 */
function registerHandlebarsHelpers(buildConfig, mediaBasePath, mediaFallbackPath) {
  
  // ============================================
  // BASIC TEXT HELPERS
  // ============================================
  
  /**
   * Escape HTML entities
   * Usage: {{escapeHtml text}}
   */
  Handlebars.registerHelper('escapeHtml', (str) => {
    return helpers.escapeHtml(str);
  });
  
  /**
   * Convert markdown to HTML
   * Usage: {{{markdown content}}}
   */
  Handlebars.registerHelper('markdown', (str) => {
    return new Handlebars.SafeString(helpers.markdownToHtml(str));
  });
  
  /**
   * Uppercase text
   * Usage: {{upper text}}
   */
  Handlebars.registerHelper('upper', (str) => {
    return typeof str === 'string' ? str.toUpperCase() : str;
  });
  
  /**
   * Lowercase text
   * Usage: {{lower text}}
   */
  Handlebars.registerHelper('lower', (str) => {
    return typeof str === 'string' ? str.toLowerCase() : str;
  });
  
  
  // ============================================
  // PATH RESOLUTION HELPERS
  // ============================================
  
  /**
   * Resolve media path (handles CDN and local paths)
   * Usage: {{mediaPath imageSrc}}
   */
  Handlebars.registerHelper('mediaPath', (src) => {
    return helpers.resolveMediaPath(src, mediaBasePath, mediaFallbackPath);
  });
  
  /**
   * Resolve internal link path
   * Usage: {{linkPath targetId}}
   */
  Handlebars.registerHelper('linkPath', (targetId) => {
    return helpers.resolveLinkPath(targetId);
  });
  
  
  // ============================================
  // ELEMENT RENDERING HELPERS
  // ============================================
  
  /**
   * Render a media element (image or carousel)
   * Usage: {{{renderMedia element}}}
   */
  Handlebars.registerHelper('renderMedia', (element) => {
    const html = helpers.renderMediaElement(element, mediaBasePath);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Render a title element
   * Usage: {{{renderTitle element}}}
   */
  Handlebars.registerHelper('renderTitle', (element) => {
    const html = helpers.renderTitleElement(element);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Render a paragraph element
   * Usage: {{{renderParagraph element}}}
   */
  Handlebars.registerHelper('renderParagraph', (element) => {
    const html = helpers.renderParagraphElement(element);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Render a list element
   * Usage: {{{renderList element}}}
   */
  Handlebars.registerHelper('renderList', (element) => {
    const html = helpers.renderListElement(element);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Render a call-to-action element
   * Usage: {{{renderCTA element}}}
   */
  Handlebars.registerHelper('renderCTA', (element) => {
    const html = helpers.renderCallToActionElement(element);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Render a spacer element
   * Usage: {{{renderSpacer element}}}
   */
  Handlebars.registerHelper('renderSpacer', (element) => {
    const html = helpers.renderSpacerElement(element);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Generic element renderer (dispatches to appropriate renderer)
   * Usage: {{{renderElement element}}}
   * 
   * Handlebars.registerHelper('renderElement', (element) => {
   *   if (!element || !element.type) {
   *     return new Handlebars.SafeString('<!-- Invalid element -->');
   *   }
   */

  /**
   * Generic element renderer (Dispatches to appropriate renderer)
   * Essential for text_block.hbs to render mixed element types sequentially.
   * Usage: {{{renderElement this}}}
   */
  Handlebars.registerHelper('renderElement', (element) => {
    if (!element || !element.type) {
      return new Handlebars.SafeString('');
    }  

    
   let html = '';
     switch (element.type) {
       case 'title':
         html = helpers.renderTitleElement(element);
         break;
       case 'paragraph':
         html = helpers.renderParagraphElement(element);
         break;
       case 'list':
         html = helpers.renderListElement(element);
         break;
       case 'media':
         // Requires the mediaBasePath passed into registerHandlebarsHelpers
         html = helpers.renderMediaElement(element, mediaBasePath);
         break;
       case 'callToAction':
         html = helpers.renderCallToActionElement(element);
         break;
       case 'spacer':
         html = helpers.renderSpacerElement(element);
         break;
       default:
         html = ``;
     }
    
    return new Handlebars.SafeString(html);
  });
  
  
  // ============================================
  // CSS CLASS HELPERS
  // ============================================
  
  /**
   * Get grid column CSS class
   * Usage: {{gridColumnClass columns}}
   */
  Handlebars.registerHelper('gridColumnClass', (columns) => {
    return helpers.getGridColumnClass(columns);
  });
  
  /**
   * Get split ratio CSS class
   * Usage: {{splitClass split}}
   */
  Handlebars.registerHelper('splitClass', (split) => {
    return helpers.getSplitClass(split);
  });
  
  /**
   * Get image side CSS class
   * Usage: {{imageSideClass side}}
   */
  Handlebars.registerHelper('imageSideClass', (side) => {
    return helpers.getImageSideClass(side);
  });
  
  /**
   * Get form field size CSS class
   * Usage: {{formSizeClass size}}
   */
  Handlebars.registerHelper('formSizeClass', (size) => {
    return helpers.getFormSizeClass(size);
  });
  
  
  // ============================================
  // POSITION-BASED FILTERING HELPERS
  // ============================================
  
  /**
   * Filter elements by position
   * Usage: {{#each (filterByPosition elements "left")}}
   */
  Handlebars.registerHelper('filterByPosition', (elements, position) => {
    if (!Array.isArray(elements)) return [];
    return elements.filter(el => el.position === position);
  });
  
  /**
   * Get elements without position attribute (header elements)
   * Usage: {{#each (headerElements elements)}}
   */
  Handlebars.registerHelper('headerElements', (elements) => {
    if (!Array.isArray(elements)) return [];
    return elements.filter(el => !el.position || el.position === 'header');
  });
  
  /**
   * Sort elements into position groups
   * Usage: {{#with (sortByPosition elements)}}
   */
  Handlebars.registerHelper('sortByPosition', (elements) => {
    return helpers.sortElementsByPosition(elements);
  });
  
  
  // ============================================
  // CONDITIONAL HELPERS
  // ============================================
  
  /**
   * Equality check
   * Usage: {{#if (eq value1 value2)}}
   */
  Handlebars.registerHelper('eq', (a, b) => {
    return a === b;
  });
  
  /**
   * Not equal check
   * Usage: {{#if (ne value1 value2)}}
   */
  Handlebars.registerHelper('ne', (a, b) => {
    return a !== b;
  });
  
  /**
   * Greater than check
   * Usage: {{#if (gt value1 value2)}}
   */
  Handlebars.registerHelper('gt', (a, b) => {
    return a > b;
  });
  
  /**
   * Less than check
   * Usage: {{#if (lt value1 value2)}}
   */
  Handlebars.registerHelper('lt', (a, b) => {
    return a < b;
  });
  
  /**
   * Logical AND
   * Usage: {{#if (and condition1 condition2)}}
   */
  Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });
  
  /**
   * Logical OR
   * Usage: {{#if (or condition1 condition2)}}
   */
  Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });
  
  /**
   * Logical NOT
   * Required to fix: Missing helper: "not"
   * Usage: {{#if (not condition)}} 
   */
  Handlebars.registerHelper('not', (value) => {
    return !value;
  });

  /**
   * Check if array/string contains value
   * Usage: {{#if (contains array value)}}
   */
  Handlebars.registerHelper('contains', (collection, value) => {
    if (Array.isArray(collection)) {
      return collection.includes(value);
    }
    if (typeof collection === 'string') {
      return collection.includes(value);
    }
    return false;
  });
  
  
  // ============================================
  // ARRAY/COLLECTION HELPERS
  // ============================================
  
  /**
   * Get array length
   * Usage: {{length array}}
   */
  Handlebars.registerHelper('length', (array) => {
    if (Array.isArray(array)) return array.length;
    if (typeof array === 'string') return array.length;
    return 0;
  });
  
  /**
   * Get first item from array
   * Usage: {{first array}}
   */
  Handlebars.registerHelper('first', (array) => {
    if (Array.isArray(array) && array.length > 0) return array[0];
    return null;
  });
  
  /**
   * Get last item from array
   * Usage: {{last array}}
   */
  Handlebars.registerHelper('last', (array) => {
    if (Array.isArray(array) && array.length > 0) return array[array.length - 1];
    return null;
  });
  
  /**
   * Join array with separator
   * Usage: {{join array ", "}}
   */
  Handlebars.registerHelper('join', (array, separator) => {
    if (Array.isArray(array)) return array.join(separator || ', ');
    return '';
  });
  
  
  // ============================================
  // JSON/DATA HELPERS
  // ============================================
  
  /**
   * Stringify JSON (for embedded data)
   * Usage: {{{json object}}}
   */
  Handlebars.registerHelper('json', (context) => {
    return new Handlebars.SafeString(JSON.stringify(context, null, 2));
  });
  
  /**
   * Pretty print JSON for debugging
   * Usage: {{{jsonPretty object}}}
   */
  Handlebars.registerHelper('jsonPretty', (context) => {
    const json = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(`<pre>${helpers.escapeHtml(json)}</pre>`);
  });
  
  
  // ============================================
  // DEBUGGING HELPERS
  // ============================================
  
  /**
   * Log value to console (for debugging templates)
   * Usage: {{log variable}}
   */
  Handlebars.registerHelper('log', function() {
    console.log('[Handlebars Log]', ...arguments);
  });
  
  /**
   * Dump variable as HTML comment (for debugging)
   * Usage: {{{debug variable}}}
   */
  Handlebars.registerHelper('debug', (context) => {
    const json = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(`<!-- DEBUG:\n${json}\n-->`);
  });
  
  
  // ============================================
  // FORM HELPERS
  // ============================================
  
  /**
   * Check if form field is required
   * Usage: {{#if (isRequired field)}}
   */
  Handlebars.registerHelper('isRequired', (field) => {
    return field && field.required === true;
  });
  
  /**
   * Get form field type
   * Usage: {{fieldType field}}
   */
  Handlebars.registerHelper('fieldType', (field) => {
    return field && field.type ? field.type : 'text';
  });
  
  /**
   * Generate form field ID
   * Usage: {{fieldId field}}
   */
  Handlebars.registerHelper('fieldId', (field) => {
    if (field && field.name) return field.name;
    return `field-${Math.random().toString(36).substring(7)}`;
  });
  
  
  // ============================================
  // CAROUSEL HELPERS
  // ============================================
  
  /**
   * Build complete carousel HTML
   * Usage: {{{carousel media altText}}}
   */
  Handlebars.registerHelper('carousel', (media, altText) => {
    const html = helpers.buildCarouselHtml(media, altText, mediaBasePath);
    return new Handlebars.SafeString(html);
  });
  
  /**
   * Build single image HTML
   * Usage: {{{image media altText}}}
   */
  Handlebars.registerHelper('image', (media, altText) => {
    const html = helpers.buildImageHtml(media, altText, mediaBasePath);
    return new Handlebars.SafeString(html);
  });
  
  
  // ============================================
  // UTILITY HELPERS
  // ============================================
  
  /**
   * Default value if empty
   * Usage: {{default value "fallback"}}
   */
  Handlebars.registerHelper('default', (value, defaultValue) => {
    return value || defaultValue;
  });
  
  /**
   * Ternary operator
   * Usage: {{ternary condition "true value" "false value"}}
   */
  Handlebars.registerHelper('ternary', (condition, trueValue, falseValue) => {
    return condition ? trueValue : falseValue;
  });
  
  /**
   * Math operations
   * Usage: {{math value "+" 1}}
   */
  Handlebars.registerHelper('math', (lvalue, operator, rvalue) => {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    
    switch (operator) {
      case '+': return lvalue + rvalue;
      case '-': return lvalue - rvalue;
      case '*': return lvalue * rvalue;
      case '/': return lvalue / rvalue;
      case '%': return lvalue % rvalue;
      default: return lvalue;
    }
  });
  
  /**
   * Increment value
   * Usage: {{inc value}}
   */
  Handlebars.registerHelper('inc', (value) => {
    return parseInt(value) + 1;
  });
  
  /**
   * Decrement value
   * Usage: {{dec value}}
   */
  Handlebars.registerHelper('dec', (value) => {
    return parseInt(value) - 1;
  });
  
  
  console.log('[Handlebars] ✓ Registered all helpers');
}

module.exports = {
  registerHandlebarsHelpers
};
