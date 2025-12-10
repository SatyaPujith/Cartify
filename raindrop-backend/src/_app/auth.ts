/**
 * goCartAI - Public API Authentication
 * 
 * This API is publicly accessible for the shopping assistant.
 * No JWT verification required for the goCart endpoints.
 */

/**
 * verify - Skip JWT verification for public API
 */
export const verify = () => true;

/**
 * authorize - Allow all requests (public API)
 */
export const authorize = () => true;
