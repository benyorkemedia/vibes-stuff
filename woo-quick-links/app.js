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
 * Creates a table row for explorer links
 * @param {Object} link - Link object with name, url, tokenBalance
 * @returns {HTMLElement} - The table row element
 */
function createExplorerRow(link) {
    const row = document.createElement('a');
    row.className = 'explorer-row';
    row.href = link.url;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    row.setAttribute('data-category', link.category);

    // Network icon
    const iconCell = document.createElement('div');
    iconCell.className = 'explorer-icon';
    const icon = document.createElement('img');
    icon.src = link.image;
    icon.alt = link.name;
    iconCell.appendChild(icon);

    // Network name
    const nameCell = document.createElement('div');
    nameCell.className = 'explorer-name';
    nameCell.textContent = link.name;

    // Token balance
    const balanceCell = document.createElement('div');
    balanceCell.className = 'explorer-balance';
    balanceCell.textContent = link.tokenBalance ? formatNumber(link.tokenBalance) : '-';

    // Assemble row
    row.appendChild(iconCell);
    row.appendChild(nameCell);
    row.appendChild(balanceCell);

    return row;
}

/**
 * Renders a pie chart showing token distribution across chains
 * @param {Array} explorerLinks - Array of explorer link objects with tokenBalance
 */
function renderDistributionChart(explorerLinks) {
    // Create chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = `
        <canvas id="distribution-chart"></canvas>
    `;

    // Get data for chart
    const labels = explorerLinks.map(link => link.name);
    const data = explorerLinks.map(link => link.tokenBalance || 0);

    // Chain-specific colors
    const chainColors = {
        'Ethereum': '#627EEA',
        'BSC': '#F3BA2F',
        'Arbitrum': '#28A0F0',
        'Polygon': '#8247E5',
        'Avalanche': '#E84142',
        'Optimism': '#FF0420',
        'Base': '#0052FF',
        'Solana': '#14F195',
        'Mantle': '#000000'
    };

    const colors = explorerLinks.map(link => chainColors[link.name] || '#00A9DE');

    // Wait for next tick to ensure canvas is in DOM
    setTimeout(() => {
        const ctx = document.getElementById('distribution-chart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#1a1a1a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                color: '#ffffff',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: {
                                family: "'IBM Plex Sans', sans-serif",
                                size: 13
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            generateLabels: (chart) => {
                                const data = chart.data;
                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].backgroundColor[i],
                                        fontColor: '#ffffff',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#222',
                        titleColor: '#00A9DE',
                        bodyColor: '#ffffff',
                        borderColor: '#333',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        titleFont: {
                            family: "'IBM Plex Sans', sans-serif",
                            size: 13
                        },
                        bodyFont: {
                            family: "'IBM Plex Sans', sans-serif",
                            size: 12
                        },
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${formatNumber(value)} WOO (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }, 0);

    return chartContainer;
}

/**
 * Renders links organized by sections with headers
 */
function renderLinksWithSections() {
    const grid = document.getElementById('links-grid');
    grid.innerHTML = '';

    // Group links by category
    const categories = ['Platform', 'Analytics', 'Explorers', 'Social'];

    categories.forEach(category => {
        // Filter links for this category
        const categoryLinks = wooLinks.filter(link => link.category === category);

        if (categoryLinks.length > 0) {
            // Create section header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = category;
            grid.appendChild(sectionHeader);

            // Render differently for Explorers (table) vs others (cards)
            if (category === 'Explorers') {
                // Sort explorers by token balance (highest to lowest)
                const sortedExplorers = [...categoryLinks].sort((a, b) =>
                    (b.tokenBalance || 0) - (a.tokenBalance || 0)
                );

                // Add pie chart above explorer table
                const chartContainer = renderDistributionChart(sortedExplorers);
                grid.appendChild(chartContainer);

                // Create table container for explorers
                const tableContainer = document.createElement('div');
                tableContainer.className = 'explorer-table';

                // Add table header
                const headerRow = document.createElement('div');
                headerRow.className = 'explorer-header';
                headerRow.innerHTML = `
                    <div class="explorer-icon-header"></div>
                    <div class="explorer-name-header">Network</div>
                    <div class="explorer-balance-header">Quantity</div>
                `;
                tableContainer.appendChild(headerRow);

                // Add explorer rows (already sorted)
                sortedExplorers.forEach(link => {
                    const row = createExplorerRow(link);
                    tableContainer.appendChild(row);
                });

                grid.appendChild(tableContainer);
            } else {
                // Add cards for non-explorer categories
                categoryLinks.forEach(link => {
                    const card = createLinkCard(link);
                    grid.appendChild(card);
                });
            }
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
