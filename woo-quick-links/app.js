// Array of WOO-related links (hardcoded for Phase 1)
const wooLinks = [
    {
        name: "WOOFi Pro",
        url: "https://pro.woofi.com/en/",
        image: "assets/woofi-pro.svg",
        category: "Platform",
        imageClass: "svg-logo"
    },
    {
        name: "Starchild",
        url: "https://iamstarchild.com/",
        image: "assets/starchild.png",
        category: "Platform"
    },
    {
        name: "WOOFi Dashboard",
        url: "https://woofi.com/swap/dashboard",
        image: "assets/woofi-dashboard.svg",
        category: "Analytics",
        imageClass: "svg-logo"
    },
    {
        name: "WOOFi Swap Dune",
        url: "https://dune.com/woofianalytics/woofi-dashboard",
        image: "assets/woofi-swap-dune.png",
        category: "Analytics",
        imageClass: "dune-logo"
    },
    {
        name: "WOOFi Stake Dune",
        url: "https://dune.com/woofianalytics/woofi-staking",
        image: "assets/woofi-stake-dune.png",
        category: "Analytics",
        imageClass: "dune-logo"
    },
    {
        name: "WOOFi Buyback Dune",
        url: "https://dune.com/woofianalytics/woo-buyback-and-burn",
        image: "assets/woofi-buyback-dune.png",
        category: "Analytics",
        imageClass: "dune-logo"
    },
    {
        name: "WOO Stake",
        url: "https://woofi.com/swap/stake",
        image: "assets/woofi-stake.svg",
        category: "Platform",
        imageClass: "svg-logo"
    },
    {
        name: "WOOFi on x.com",
        url: "https://x.com/_WOOFi",
        image: "assets/woofi-x.png",
        category: "Social"
    },
    {
        name: "Starchild on x.com",
        url: "https://x.com/StarchildOnX",
        image: "assets/starchild-x.png",
        category: "Social"
    }
];

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

    // Create category tag in top-right corner
    const categoryTag = document.createElement('div');
    categoryTag.className = 'category-tag';
    categoryTag.textContent = link.category;

    // Create image element
    const img = document.createElement('img');
    img.className = link.imageClass ? `card-image ${link.imageClass}` : 'card-image';
    img.src = link.image;
    img.alt = link.name;
    img.loading = 'lazy'; // Lazy load images for better performance

    // Create title element
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = link.name;

    // Assemble the card
    card.appendChild(categoryTag);
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

// Initialize the page when DOM is fully loaded
document.addEventListener('DOMContentLoaded', renderLinks);
