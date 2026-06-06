"use strict";

/**
 * Global configuration constants.
 * The API key is securely loaded from localStorage to prevent source code exposure.
 * @type {string}
 */
let GEMINI_API_KEY = '';

/**
 * Loads the API key asynchronously from .env.local or falls back to localStorage.
 * @returns {Promise<string>} Resolves with the API key.
 */
async function config_loadApiKey() {
  // 1. Try to load from .env.local
  try {
    const res = await fetch('/.env.local', { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const match = text.match(/GEMINI_API_KEY\s*=\s*(["']?)([^"'\r\n]+)\1/);
      if (match && match[2]) {
        GEMINI_API_KEY = match[2].trim();
        console.log("Loaded API key from .env.local");
        return GEMINI_API_KEY;
      }
    }
  } catch (e) {
    // Ignore and proceed
  }

  // 2. Try to load from Vercel Serverless Function /api/config
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.GEMINI_API_KEY) {
        GEMINI_API_KEY = data.GEMINI_API_KEY.trim();
        console.log("Loaded API key from Vercel API");
        return GEMINI_API_KEY;
      }
    }
  } catch (e) {
    // Ignore and proceed to localStorage fallback
  }

  // 3. Try to load from localStorage
  if (typeof localStorage !== 'undefined') {
    const _encryptedKey = localStorage.getItem('kivi_api_key');
    if (_encryptedKey && typeof decryptData === 'function') {
      try {
        GEMINI_API_KEY = await decryptData(_encryptedKey);
        console.log("Loaded API key from localStorage");
        return GEMINI_API_KEY;
      } catch (e) {
        GEMINI_API_KEY = '';
      }
    }
  }
  return '';
}

// Start loading the API key immediately and expose the promise globally
window.apiKeyPromise = config_loadApiKey();


