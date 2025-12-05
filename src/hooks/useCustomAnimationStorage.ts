import { useState, useCallback, useEffect } from 'react';
import { setJsonCookie, getJsonCookie } from '@/lib/cookie-utils';

export interface CustomAnimation {
  id: string;
  name: string;
  frames: Array<{ dur: number; arr: boolean[] }>;
  createdAt: string;
  status: string;
}

export interface UserPreferences {
  favorites: Set<string>;
  equippedId: string;
  skipDialogs: Set<string>;
}

const ANIMATIONS_COOKIE_KEY = 'custom_animations';
const FAVORITES_COOKIE_KEY = 'favorites';
const EQUIPPED_ID_COOKIE_KEY = 'equipped_id';
const SKIP_DIALOGS_COOKIE_KEY = 'skip_dialogs';

/**
 * Hook for managing custom animations with cookie persistence
 */
export function useCustomAnimationStorage() {
  const [isLoading, setIsLoading] = useState(true);
  const [customAnimations, setCustomAnimations] = useState<CustomAnimation[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [equippedId, setEquippedId] = useState<string>('logo');
  const [skipDialogs, setSkipDialogs] = useState<Set<string>>(new Set());

  // Load from cookies on mount
  useEffect(() => {
    const loadFromCookies = () => {
      try {
        // Load custom animations
        const savedAnimations = getJsonCookie<CustomAnimation[]>(ANIMATIONS_COOKIE_KEY);
        if (savedAnimations) {
          setCustomAnimations(savedAnimations);
        }

        // Load favorites
        const savedFavorites = getJsonCookie<string[]>(FAVORITES_COOKIE_KEY);
        if (savedFavorites) {
          setFavorites(new Set(savedFavorites));
        }

        // Load equipped ID
        const savedEquipped = getJsonCookie<string>(EQUIPPED_ID_COOKIE_KEY);
        if (savedEquipped) {
          setEquippedId(savedEquipped);
        }

        // Load skip dialogs
        const savedSkipDialogs = getJsonCookie<string[]>(SKIP_DIALOGS_COOKIE_KEY);
        if (savedSkipDialogs) {
          setSkipDialogs(new Set(savedSkipDialogs));
        }
      } catch (error) {
        console.error('Failed to load from cookies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromCookies();
  }, []);

  // Save animations to cookie whenever they change
  const saveAnimations = useCallback((animations: CustomAnimation[]) => {
    setCustomAnimations(animations);
    setJsonCookie(ANIMATIONS_COOKIE_KEY, animations);
  }, []);

  // Save favorites to cookie
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    setFavorites(newFavorites);
    setJsonCookie(FAVORITES_COOKIE_KEY, Array.from(newFavorites));
  }, []);

  // Save equipped ID to cookie
  const saveEquippedId = useCallback((id: string) => {
    setEquippedId(id);
    setJsonCookie(EQUIPPED_ID_COOKIE_KEY, id);
  }, []);

  // Save skip dialogs to cookie
  const saveSkipDialogs = useCallback((dialogs: Set<string>) => {
    setSkipDialogs(dialogs);
    setJsonCookie(SKIP_DIALOGS_COOKIE_KEY, Array.from(dialogs));
  }, []);

  // Add animation
  const addAnimation = useCallback((animation: CustomAnimation) => {
    const updated = [animation, ...customAnimations];
    saveAnimations(updated);
  }, [customAnimations, saveAnimations]);

  // Update animation
  const updateAnimation = useCallback((id: string, updates: Partial<CustomAnimation>) => {
    const updated = customAnimations.map(anim =>
      anim.id === id ? { ...anim, ...updates } : anim
    );
    saveAnimations(updated);
  }, [customAnimations, saveAnimations]);

  // Delete animation
  const deleteAnimation = useCallback((id: string) => {
    const updated = customAnimations.filter(anim => anim.id !== id);
    saveAnimations(updated);
    
    // Remove from favorites if it was there
    if (favorites.has(id)) {
      const newFavorites = new Set(favorites);
      newFavorites.delete(id);
      saveFavorites(newFavorites);
    }
  }, [customAnimations, favorites, saveAnimations, saveFavorites]);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  return {
    isLoading,
    customAnimations,
    favorites,
    equippedId,
    skipDialogs,
    addAnimation,
    updateAnimation,
    deleteAnimation,
    saveAnimations,
    saveFavorites,
    saveEquippedId,
    saveSkipDialogs,
    toggleFavorite,
  };
}
