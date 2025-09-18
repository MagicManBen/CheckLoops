/**
 * CheckLoop Icon Service
 * 
 * Provides dynamic access to Icons8 Dusk style icons via CDN.
 * Maps common UI concepts to appropriate Dusk icons.
 * 
 * Usage:
 * import { getIcon, setIconSrc } from './icon-service.js';
 * 
 * // Get icon URL
 * const iconUrl = getIcon('memo');
 * 
 * // Set icon on element
 * setIconSrc(document.querySelector('img'), 'books');
 */

// Icons8 Dusk style API base URL
const ICONS8_API_BASE = 'https://img.icons8.com/dusk/96';

// Mapping of semantic icon names to Icons8 Dusk icon names
const ICON_MAPPING = {
  // Navigation & Actions
  'memo': 'note',
  'notes': 'note', 
  'document': 'document',
  'file': 'document',
  'scan': 'document-scanner',
  'scanner': 'document-scanner',
  'my-scans': 'note',
  
  // Learning & Training
  'books': 'books',
  'book': 'book',
  'training': 'books',
  'education': 'books',
  'learn': 'graduation-cap',
  'study': 'graduation-cap',
  
  // Quiz & Testing
  'brain': 'brain',
  'quiz': 'brain',
  'test': 'test-tube',
  'question': 'help',
  'exam': 'exam',
  
  // Achievements & Rewards
  'trophy': 'trophy',
  'achievement': 'trophy',
  'award': 'medal',
  'star': 'star',
  'badge': 'military-medal',
  'medal': 'medal',
  
  // Time & Progress
  'clock': 'clock',
  'time': 'clock',
  'timer': 'timer',
  'stopwatch': 'stopwatch',
  'alarm': 'alarm-clock',
  'calendar': 'calendar',
  'schedule': 'calendar',
  
  // Celebration & Status
  'party-popper': 'party-popper',
  'celebration': 'party-popper',
  'fire': 'fire',
  'streak': 'fire',
  'checkmark': 'checked',
  'check': 'checked',
  'done': 'checked',
  'tick': 'checked',
  'approved': 'approval',
  
  // User & Profile
  'user': 'user',
  'profile': 'user',
  'avatar': 'user',
  'person': 'user',
  'staff': 'user-group',
  'team': 'user-group',
  'group': 'user-group',
  
  // Medical & Healthcare (common in CheckLoop)
  'health': 'health-check',
  'medical': 'health-check',
  'nurse': 'nurse',
  'doctor': 'doctor',
  'healthcare': 'health-check',
  'medicine': 'pill',
  'pills': 'pill',
  'syringe': 'syringe',
  'stethoscope': 'stethoscope',
  
  // Interface Elements
  'home': 'home',
  'menu': 'menu',
  'settings': 'settings',
  'gear': 'settings',
  'search': 'search',
  'info': 'info',
  'help': 'help',
  'warning': 'warning',
  'error': 'cancel',
  'close': 'close',
  'plus': 'plus',
  'minus': 'minus',
  'edit': 'edit',
  'delete': 'delete',
  'trash': 'delete',
  
  // Communication
  'mail': 'mail',
  'email': 'mail',
  'message': 'message',
  'chat': 'chat',
  'notification': 'notification',
  
  // Data & Charts
  'chart': 'pie-chart',
  'graph': 'line-chart',
  'data': 'database',
  'report': 'report-card',
  'analytics': 'analytics',
  
  // Security & Login
  'lock': 'lock',
  'unlock': 'unlock',
  'key': 'key',
  'password': 'password',
  'login': 'login',
  'logout': 'logout',
  'shield': 'shield'
};

// Fallback icons for common concepts if specific mapping not found
const FALLBACK_MAPPING = {
  // If no specific mapping, try these generic concepts
  'document': 'document',
  'user': 'user', 
  'time': 'clock',
  'success': 'checked',
  'error': 'cancel',
  'info': 'info'
};

/**
 * Get the URL for an Icons8 Dusk style icon
 * @param {string} iconName - Semantic name of the icon (e.g., 'memo', 'books', 'brain')
 * @param {number} size - Icon size (default: 96px for good quality)
 * @returns {string} - Complete URL to the icon
 */
export function getIcon(iconName, size = 96) {
  if (!iconName) {
    console.warn('Icon name is required');
    return `${ICONS8_API_BASE}/help.png`;
  }
  
  // Normalize the icon name
  const normalizedName = iconName.toLowerCase().trim();
  
  // Look for direct mapping first
  let mappedName = ICON_MAPPING[normalizedName];
  
  // If no direct mapping, try fallback
  if (!mappedName) {
    // Try to find a partial match in mapping keys
    const partialMatch = Object.keys(ICON_MAPPING).find(key => 
      key.includes(normalizedName) || normalizedName.includes(key)
    );
    
    if (partialMatch) {
      mappedName = ICON_MAPPING[partialMatch];
    } else {
      // Use fallback
      mappedName = FALLBACK_MAPPING[normalizedName] || 'help';
      console.warn(`No specific mapping found for icon "${iconName}", using fallback: ${mappedName}`);
    }
  }
  
  // Handle different size API endpoints
  let apiBase = ICONS8_API_BASE;
  if (size !== 96) {
    apiBase = `https://img.icons8.com/dusk/${size}`;
  }
  
  const iconUrl = `${apiBase}/${mappedName}.png`;
  
  // Log for debugging (can be removed in production)
  if (typeof window !== 'undefined' && window.DEBUG_ICONS) {
    console.log(`Icon mapping: "${iconName}" -> "${mappedName}" -> ${iconUrl}`);
  }
  
  return iconUrl;
}

/**
 * Set the src of an img element to a Dusk style icon
 * @param {HTMLImageElement} imgElement - The img element to update
 * @param {string} iconName - Semantic name of the icon
 * @param {number} size - Icon size (default: 96px)
 * @param {string} alt - Alt text for the image (defaults to iconName)
 */
export function setIconSrc(imgElement, iconName, size = 96, alt = null) {
  if (!imgElement || !iconName) {
    console.warn('Both imgElement and iconName are required');
    return;
  }
  
  const iconUrl = getIcon(iconName, size);
  imgElement.src = iconUrl;
  
  if (alt !== null) {
    imgElement.alt = alt;
  } else if (!imgElement.alt) {
    imgElement.alt = iconName;
  }
  
  // Add loading attributes for better performance
  imgElement.loading = imgElement.loading || 'lazy';
  
  // Add error handling
  imgElement.onerror = function() {
    console.error(`Failed to load icon: ${iconUrl}`);
    // Fallback to a generic icon
    this.src = getIcon('help', size);
    this.alt = 'Icon not available';
  };
}

/**
 * Replace all fluent-emoji icons in the document with Dusk style equivalents
 * This function automatically scans for common fluent-emoji patterns and replaces them
 */
export function upgradeFluetEmojiToDusk() {
  const fluentEmojiImages = document.querySelectorAll('img[src*="fluent-emoji"]');
  
  fluentEmojiImages.forEach(img => {
    const currentSrc = img.src;
    let iconName = 'help'; // fallback
    
    // Extract icon name from fluent-emoji URL
    if (currentSrc.includes('memo')) iconName = 'memo';
    else if (currentSrc.includes('books')) iconName = 'books';
    else if (currentSrc.includes('brain')) iconName = 'brain';
    else if (currentSrc.includes('trophy')) iconName = 'trophy';
    else if (currentSrc.includes('party-popper')) iconName = 'party-popper';
    else if (currentSrc.includes('alarm-clock')) iconName = 'alarm';
    else if (currentSrc.includes('fire')) iconName = 'fire';
    else if (currentSrc.includes('check-mark')) iconName = 'checkmark';
    else if (currentSrc.includes('star')) iconName = 'star';
    else if (currentSrc.includes('stopwatch')) iconName = 'stopwatch';
    else {
      // Try to extract the icon name from the URL
      const match = currentSrc.match(/fluent-emoji[^:]*:([^.]+)/);
      if (match) {
        iconName = match[1].replace(/-/g, ' ').trim();
      }
    }
    
    console.log(`Upgrading fluent-emoji icon: ${currentSrc} -> ${iconName}`);
    setIconSrc(img, iconName);
  });
}

/**
 * Create a new img element with a Dusk style icon
 * @param {string} iconName - Semantic name of the icon
 * @param {number} size - Icon size (default: 96px)
 * @param {string} alt - Alt text for the image
 * @param {Object} attributes - Additional attributes to set on the img element
 * @returns {HTMLImageElement} - The created img element
 */
export function createIcon(iconName, size = 96, alt = null, attributes = {}) {
  const img = document.createElement('img');
  setIconSrc(img, iconName, size, alt || iconName);
  
  // Set additional attributes
  Object.entries(attributes).forEach(([key, value]) => {
    img.setAttribute(key, value);
  });
  
  return img;
}

/**
 * Get a list of all available semantic icon names
 * @returns {string[]} - Array of available icon names
 */
export function getAvailableIcons() {
  return Object.keys(ICON_MAPPING).sort();
}

/**
 * Test icon loading by trying to fetch an icon URL
 * @param {string} iconName - Icon name to test
 * @returns {Promise<boolean>} - Resolves to true if icon loads successfully
 */
export async function testIcon(iconName) {
  const iconUrl = getIcon(iconName);
  
  try {
    const response = await fetch(iconUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Failed to test icon ${iconName}:`, error);
    return false;
  }
}

// Enable debug mode by setting window.DEBUG_ICONS = true in console
if (typeof window !== 'undefined') {
  window.IconService = {
    getIcon,
    setIconSrc,
    upgradeFluetEmojiToDusk,
    createIcon,
    getAvailableIcons,
    testIcon,
    enableDebug: () => { window.DEBUG_ICONS = true; },
    disableDebug: () => { window.DEBUG_ICONS = false; }
  };
}

// Default export for convenience
export default {
  getIcon,
  setIconSrc,
  upgradeFluetEmojiToDusk,
  createIcon,
  getAvailableIcons,
  testIcon
};
