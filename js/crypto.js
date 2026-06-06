"use strict";
// crypto.js
// Simple wrapper around Web Crypto API for encrypting/decrypting the Gemini API key.
// Uses PBKDF2 with a static salt and a static passphrase ("kivi-secret-pass") to derive a key.
// In a real app you would ask the user for a password; here we keep it minimal but better than plain text.

(function () {
  const passphrase = 'kivi-secret-pass'; // static, not ideal but demonstrates encryption
  const salt = new Uint8Array([21, 31, 12, 45, 78, 90, 11, 23]); // fixed salt
  const ivLength = 12; // AES‑GCM recommended IV length

  async function getKey() {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a UTF‑8 string and return a base64‑encoded payload containing IV + ciphertext.
   */
  async function encryptData(plainText) {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));
    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );
    // Concatenate IV + ciphertext
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);
    // Base64 encode for storage
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt a base64‑encoded payload (IV + ciphertext) back to a UTF‑8 string.
   */
  async function decryptData(b64) {
    const key = await getKey();
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const iv = bytes.slice(0, ivLength);
    const cipher = bytes.slice(ivLength);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );
    return new TextDecoder().decode(plainBuffer);
  }

  // Expose globally for existing code.
  window.encryptData = encryptData;
  window.decryptData = decryptData;
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { encryptData, decryptData };
  }
})();

