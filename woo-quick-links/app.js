// Import API functions
import { fetchWOOMetrics, formatNumber, formatCurrency } from './js/api.js';

// Array of WOO-related links (loaded from JSON)
let wooLinks = [];

/**
 * Loads links from JSON file
 * @returns {Promise<Array>} - Array of link objects
 */
async function loadLinks() {
    try {
        const response = await fetch('data/links.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const links = await response.json();
        return links;
    } catch (error) {
        console.error('Error loading links:', error);
        // Show error message to user
        showError('Failed to load links. Please refresh the page.');
        return [];
    }
}

/**
 * Displays an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
            <p style="font-size: 1.2rem; margin-bottom: 16px;">${message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #00A9DE; border: none; border-radius: 6px; color: white; font-family: 'IBM Plex Sans', sans-serif; cursor: pointer;">
                Retry
            </button>
        </div>
    `;
}

/**
 * Auto-detects the appropriate image class based on file and URL
 * @param {string} imagePath - Path to the image file
 * @param {string} url - The link URL
 * @returns {string} - CSS class name for special treatment, or empty string
 */
function getImageClass(imagePath, url) {
    // Dune logos - detect by URL domain
    if (url.includes('dune.com')) {
        return 'dune-logo';
    }

    // SVG logos - detect by file extension
    if (imagePath.endsWith('.svg')) {
        return 'svg-logo';
    }

    // Default - no special class
    return '';
}

/**
 * Creates a link card element
 * @param {Object} link - Link object with name, url, image, and category properties
 * @returns {HTMLElement} - The card element
 */
function createLinkCard(link) {
    // Create the main card element (anchor tag for clickability)
    const card = document.createElement('a');
    card.className = 'link-card';
    card.href = link.url;
    card.target = '_blank'; // Open in new tab
    card.rel = 'noopener noreferrer'; // Security best practice for target="_blank"
    card.setAttribute('data-category', link.category); // Add category data attribute for styling

    // Create image element
    const img = document.createElement('img');
    // Auto-detect image class based on file type and URL
    const imageClass = getImageClass(link.image, link.url);
    img.className = imageClass ? `card-image ${imageClass}` : 'card-image';
    img.src = link.image;
    img.alt = link.name;
    img.loading = 'lazy'; // Lazy load images for better performance

    // Create title element
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = link.name;

    // Assemble the card
    card.appendChild(img);
    card.appendChild(title);

    return card;
}

/**
 * Renders all link cards to the grid
 */
function renderLinks() {
    // Get the grid container
    const grid = document.getElementById('links-grid');

    // Clear existing content (if any)
    grid.innerHTML = '';

    // Create and append a card for each link
    wooLinks.forEach(link => {
        const card = createLinkCard(link);
        grid.appendChild(card);
    });
}

/**
 * Renders links organized by sections with headers
 */
function renderLinksWithSections() {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = '';

    // Group links by category
    const categories = ['Platform', 'Analytics', 'Social'];

    categories.forEach(category => {
        // Filter links for this category
        const categoryLinks = wooLinks.filter(link => link.category === category);

        if (categoryLinks.length > 0) {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = category;
            grid.appendChild(sectionHeader);

            // Add cards for this category
            categoryLinks.forEach(link => {
                const card = createLinkCard(link);
                grid.appendChild(card);
            });
        }
    });
}

/**
 * Filters link cards by category
 * @param {string} category - Category to filter by, or 'all' to show all
 */
function filterLinks(category) {
    if (category === 'all') {
        // Re-render with sections when showing all
        renderLinksWithSections();
    } else {
        // Re-render without sections
        renderLinks();

        // Hide cards that don't match the category
        const cards = document.querySelectorAll('.link-card');
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (cardCategory === category) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }
}

/**
 * Renders WOO token stats
 * @param {Object} metrics - Token metrics data
 */
function renderStats(metrics) {
    const container = document.getElementById('stats-container');

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Circ. Supply</div>
            <div class="stat-value">${formatNumber(metrics.circulatingSupply)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Burned Amount</div>
            <div class="stat-value">${formatNumber(metrics.burnedAmount)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">FDV</div>
            <div class="stat-value">${formatCurrency(metrics.fdv)}</div>
        </div>
    `;
}

/**
 * Shows loading state for stats
 */
function showStatsLoading() {
    const container = document.getElementById('stats-container');
    container.innerHTML = '<div class="stats-loading">Loading metrics...</div>';
}

/**
 * Shows error state for stats
 * @param {Function} retryFunction - Function to call on retry
 */
function showStatsError(retryFunction) {
    const container = document.getElementById('stats-container');
    container.innerHTML = `
        <div class="stats-error">
            <p>Failed to load metrics</p>
            <button onclick="window.location.reload()">Retry</button>
        </div>
    `;
}

/**
 * Loads and displays WOO token stats
 */
async function loadStats() {
    showStatsLoading();

    try {
        const metrics = await fetchWOOMetrics();
        renderStats(metrics);
    } catch (error) {
        console.error('Error loading stats:', error);
        showStatsError();
    }
}

/**
 * Sets up filter button event listeners
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get the filter category from data-filter attribute
            const filterCategory = button.getAttribute('data-filter');

            // Apply the filter
            filterLinks(filterCategory);
        });
    });
}

// Initialize the page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state for links
    const grid = document.getElementById('links-grid');
    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #888;">
            <p style="font-size: 1.2rem;">Loading links...</p>
        </div>
    `;

    // Load stats and links in parallel
    const [linksResult] = await Promise.all([
        loadLinks(),
        loadStats()
    ]);

    wooLinks = linksResult;

    // If links loaded successfully, render them
    if (wooLinks.length > 0) {
        renderLinksWithSections(); // Start with sections since "All" is default
        initializeFilters();
    }
});
