/**
 * API integration for WOO token metrics
 * Handles data fetching with caching via localStorage
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_SUPPLY = 3000000000; // 3 billion WOO max supply
const LOCKED_SUPPLY = 300000000; // 300 million locked

/**
 * Fetches WOO token total supply from WOO Network API
 * @returns {Promise<number>} Total supply
 */
async function fetchTotalSupply() {
    const response = await fetch('https://sapi.woo.network/token/total_supply');
    if (!response.ok) {
        throw new Error(`Failed to fetch total supply: ${response.status}`);
    }
    const data = await response.json();
    return parseFloat(data.total_supply || data);
}

/**
 * Fetches WOO token price and market data from CoinGecko
 * @returns {Promise<Object>} Price data including USD price and market cap
 */
async function fetchPriceData() {
    const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=woo-network&vs_currencies=usd&include_market_cap=true&include_24hr_change=true'
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.status}`);
    }
    const data = await response.json();
    return data['woo-network'];
}

/**
 * Gets cached data or fetches fresh data if cache is expired
 * @param {string} cacheKey - Key for localStorage
 * @param {Function} fetchFunction - Function to fetch fresh data
 * @returns {Promise<any>} Cached or fresh data
 */
async function getCachedOrFetch(cacheKey, fetchFunction) {
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;

        if (age < CACHE_DURATION) {
            return data;
        }
    }

    // Fetch fresh data
    const freshData = await fetchFunction();

    // Cache it
    localStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
    }));

    return freshData;
}

/**
 * Fetches all WOO token metrics
 * @returns {Promise<Object>} Object containing all metrics
 */
export async function fetchWOOMetrics() {
    try {
        // Fetch both APIs in parallel
        const [totalSupply, priceData] = await Promise.all([
            getCachedOrFetch('woo_total_supply', fetchTotalSupply),
            getCachedOrFetch('woo_price_data', fetchPriceData)
        ]);

        // Calculate derived metrics
        const circulatingSupply = totalSupply - LOCKED_SUPPLY;
        const burnedAmount = MAX_SUPPLY - totalSupply;
        const fdv = priceData.usd * MAX_SUPPLY;

        return {
            totalSupply,
            circulatingSupply,
            burnedAmount,
            price: priceData.usd,
            marketCap: priceData.usd_market_cap,
            priceChange24h: priceData.usd_24h_change,
            fdv,
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error('Error fetching WOO metrics:', error);
        throw error;
    }
}

/**
 * Formats large numbers with B/M suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places (default 2)
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 2) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(decimals) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(decimals) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(decimals) + 'K';
    }
    return num.toFixed(decimals);
}

/**
 * Formats currency values
 * @param {number} num - Number to format
 * @returns {string} Formatted currency
 */
export function formatCurrency(num) {
    if (num >= 1e9) {
        return '$' + (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
        return '$' + (num / 1e6).toFixed(2) + 'M';
    }
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
