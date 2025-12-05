/**
 * LocalStorage utilities for animation persistence
 */

export interface StoredAnimation {
  id: string;
  name: string;
  frames: Array<{ dur: number; arr: boolean[] }>;
  createdAt: string;
  status: string;
}

const STORAGE_KEYS = {
  CUSTOM_ANIMATIONS: 'customAnimations',
  EQUIPPED_ANIMATION: 'equippedAnimationId',
  FAVORITES: 'favorites',
  SKIP_DIALOGS: 'skipDialogs',
} as const;

/**
 * Get all custom animations from localStorage
 */
export function getCustomAnimations(): StoredAnimation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_ANIMATIONS);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load custom animations:', error);
    return [];
  }
}

/**
 * Save custom animations to localStorage
 */
export function saveCustomAnimations(animations: StoredAnimation[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ANIMATIONS, JSON.stringify(animations));
    window.dispatchEvent(new Event('customAnimationsUpdated'));
  } catch (error) {
    console.error('Failed to save custom animations:', error);
  }
}

/**
 * Get the currently equipped animation ID
 */
export function getEquippedAnimationId(): string {
  if (typeof window === 'undefined') return 'logo';
  
  try {
    return localStorage.getItem(STORAGE_KEYS.EQUIPPED_ANIMATION) || 'logo';
  } catch (error) {
    console.error('Failed to load equipped animation:', error);
    return 'logo';
  }
}

/**
 * Set the equipped animation ID
 */
export function setEquippedAnimationId(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPPED_ANIMATION, id);
  } catch (error) {
    console.error('Failed to save equipped animation:', error);
  }
}

/**
 * Get favorites set
 */
export function getFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return new Set();
  }
}

/**
 * Save favorites set
 */
export function saveFavorites(favorites: Set<string>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...favorites]));
  } catch (error) {
    console.error('Failed to save favorites:', error);
  }
}
