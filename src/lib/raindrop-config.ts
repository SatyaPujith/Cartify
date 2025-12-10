// Raindrop Backend Configuration
// Update this URL after deploying to Raindrop

// The URL will be provided after running: raindrop build find
// Format: https://cartify-api.<tenant>.lmapp.run
export const RAINDROP_API_URL = import.meta.env.VITE_RAINDROP_API_URL || '';

// Helper to check if Raindrop backend is configured
export const isRaindropConfigured = () => !!RAINDROP_API_URL;

// API endpoints
export const RAINDROP_ENDPOINTS = {
  cartifyAgent: `${RAINDROP_API_URL}/api/cartify-agent`,
  speechToText: `${RAINDROP_API_URL}/api/speech-to-text`,
  health: `${RAINDROP_API_URL}/health`,
};
