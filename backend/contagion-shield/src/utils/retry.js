/**
 * Retry utility - Implements exponential backoff for async functions.
 */
import { createLogger } from './logger.js';

const logger = createLogger('retry-util');

/**
 * Retries an async function with exponential backoff.
 * 
 * @param {Function} fn - The async function to retry.
 * @param {Object} options - Retry options.
 * @param {number} options.maxRetries - Maximum number of retries (default: 3).
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000).
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000).
 * @param {string} options.onRetryMessage - Log message on retry.
 * @returns {Promise<any>}
 */
export const withRetry = async (fn, { 
  maxRetries = 3, 
  initialDelay = 1000, 
  maxDelay = 30000,
  onRetryMessage = 'Retrying operation...'
} = {}) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      logger.warn({ 
        attempt: attempt + 1, 
        maxRetries, 
        delay, 
        error: error.message,
        message: onRetryMessage 
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Executes a function after a delay.
 * @param {number} ms 
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
