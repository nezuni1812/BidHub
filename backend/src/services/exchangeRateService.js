/**
 * Exchange Rate Service
 * Fetches real-time VND to USD exchange rate from free API
 */
const axios = require('axios');

// Default fallback rate if API fails
const FALLBACK_VND_TO_USD_RATE = 25000;

// Cache for exchange rate (to avoid too many API calls)
let cachedRate = null;
let cacheTimestamp = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Get VND to USD exchange rate
 * Uses exchangerate-api.com free tier (1500 requests/month)
 * @returns {Promise<number>} Exchange rate (1 USD = X VND)
 */
async function getVNDtoUSDRate() {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedRate && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log('Using cached exchange rate:', cachedRate);
      return cachedRate;
    }

    // Fetch from API
    // Using exchangerate-api.com free tier
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.rates && response.data.rates.VND) {
      const rate = response.data.rates.VND;
      
      // Update cache
      cachedRate = rate;
      cacheTimestamp = now;
      
      console.log('Fetched new exchange rate:', rate, 'VND per 1 USD');
      return rate;
    } else {
      console.warn('Invalid response from exchange rate API, using fallback rate');
      return FALLBACK_VND_TO_USD_RATE;
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error.message);
    console.log('Using fallback rate:', FALLBACK_VND_TO_USD_RATE);
    return FALLBACK_VND_TO_USD_RATE;
  }
}

/**
 * Convert VND amount to USD cents (for Stripe)
 * @param {number} amountVND - Amount in VND
 * @returns {Promise<{amountCents: number, rate: number}>} Amount in USD cents and the rate used
 */
async function convertVNDtoUSDCents(amountVND) {
  const rate = await getVNDtoUSDRate();
  const amountUSD = amountVND / rate;
  const amountCents = Math.round(amountUSD * 100); // Convert to cents
  
  return {
    amountCents,
    rate,
    amountUSD: amountUSD.toFixed(2)
  };
}

/**
 * Clear the exchange rate cache (useful for testing)
 */
function clearCache() {
  cachedRate = null;
  cacheTimestamp = null;
}

module.exports = {
  getVNDtoUSDRate,
  convertVNDtoUSDCents,
  clearCache,
  FALLBACK_VND_TO_USD_RATE
};
