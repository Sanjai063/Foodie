/**
 * FoodieBites - Centralized Frontend Configuration
 * ==============================================================
 * This configuration file manages the API Base URL for the entire
 * frontend application across local development and production.
 *
 * HOW TO SWITCH TO YOUR PRODUCTION BACKEND (RENDER):
 * 1. Deploy your backend to Render as a Web Service.
 * 2. Copy your Render backend URL (e.g., https://foodiebites-backend.onrender.com).
 * 3. Paste it on LINE 22 below, replacing the placeholder, keeping '/api' at the end.
 *
 * NOTE: When running on localhost / 127.0.0.1, the frontend automatically
 * connects to http://localhost:5000/api without needing any manual changes.
 * ==============================================================
 */

const CONFIG = {
  // ============================================================
  // >>> LINE 22: PASTE YOUR DEPLOYED RENDER BACKEND URL HERE <<<
  // Example: 'https://foodiebites-backend.onrender.com/api'
  // ============================================================
  PROD_API_BASE_URL: 'https://foodiebites-backend.onrender.com/api',

  // Local development backend URL
  LOCAL_API_BASE_URL: 'http://localhost:5000/api'
};

// Auto-detect local development vs deployed production environment
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]' ||
  window.location.protocol === 'file:'
);

// Resolve the active API base URL
const ACTIVE_API_BASE = isLocalhost ? CONFIG.LOCAL_API_BASE_URL : CONFIG.PROD_API_BASE_URL;

// Expose globally so every page, component, and admin panel has access
window.API_BASE_URL = ACTIVE_API_BASE;
window.API_BASE = ACTIVE_API_BASE;
