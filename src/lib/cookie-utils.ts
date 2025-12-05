/**
 * Cookie utilities for persisting user data
 * Stores custom animations, favorites, and user preferences
 */

const COOKIE_PREFIX = 'owow_';
const COOKIE_EXPIRY_DAYS = 365; // 1 year

/**
 * Set a cookie with automatic expiry
 */
export function setCookie(key: string, value: string, days: number = COOKIE_EXPIRY_DAYS) {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  const cookieName = `${COOKIE_PREFIX}${key}`;
  document.cookie = `${cookieName}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
}

/**
 * Get a cookie value
 */
export function getCookie(key: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookieName = `${COOKIE_PREFIX}${key}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length);
    }
  }
  
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(key: string) {
  if (typeof document === 'undefined') return;
  
  setCookie(key, '', -1);
}

/**
 * Store JSON data in cookie
 */
export function setJsonCookie<T>(key: string, value: T): void {
  try {
    const json = JSON.stringify(value);
    setCookie(key, json);
  } catch (error) {
    console.error(`Failed to set JSON cookie for ${key}:`, error);
  }
}

/**
 * Get JSON data from cookie
 */
export function getJsonCookie<T>(key: string): T | null {
  try {
    const value = getCookie(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to parse JSON cookie for ${key}:`, error);
    return null;
  }
}
