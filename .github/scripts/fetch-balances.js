const fs = require('fs');
const path = require('path');

// Check Node version and import ethers accordingly
let ethers;
try {
    ethers = require('ethers');
} catch (error) {
    console.error('Note: ethers requires Node 14+. This script will work in GitHub Actions with Node 20.');
    console.error('Error:', error.message);
    process.exit(0); // Exit gracefully for local testing with old Node
}

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

// Chain configurations with public RPC endpoints
const CHAINS = {
    'Ethereum': {
        rpc: 'https://eth.llamarpc.com',
        decimals: 18
    },
    'BSC': {
        rpc: 'https://bsc-dataseed1.binance.org',
        decimals: 18
    },
    'Arbitrum': {
        rpc: 'https://arb1.arbitrum.io/rpc',
        decimals: 18
    },
    'Polygon': {
        rpc: 'https://polygon-rpc.com',
        decimals: 18
    },
    'Avalanche': {
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        decimals: 18
    },
    'Optimism': {
        rpc: 'https://mainnet.optimism.io',
        decimals: 18
    },
    'Base': {
        rpc: 'https://mainnet.base.org',
        decimals: 18
    },
    'Mantle': {
        rpc: 'https://rpc.mantle.xyz',
        decimals: 18
    }
};

/**
 * Fetches token total supply for EVM chains
 */
async function fetchEVMTotalSupply(chainName, contractAddress) {
    try {
        const config = CHAINS[chainName];
        const provider = new ethers.JsonRpcProvider(config.rpc);
        const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

        const totalSupply = await contract.totalSupply();
        const decimals = await contract.decimals();

        // Convert to human-readable format
        const balance = Number(ethers.formatUnits(totalSupply, decimals));

        console.log(`✓ ${chainName}: ${balance.toLocaleString()} WOO`);
        return balance;
    } catch (error) {
        console.error(`✗ ${chainName}: ${error.message}`);
        return 0;
    }
}

/**
 * Fetches token supply for Solana
 */
async function fetchSolanaTotalSupply(tokenAddress) {
    try {
        const response = await fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getTokenSupply',
                params: [tokenAddress]
            })
        });

        const data = await response.json();

        if (data.result && data.result.value) {
            const balance = Number(data.result.value.uiAmount);
            console.log(`✓ Solana: ${balance.toLocaleString()} WOO`);
            return balance;
        }

        throw new Error('Invalid response from Solana RPC');
    } catch (error) {
        console.error(`✗ Solana: ${error.message}`);
        return 0;
    }
}

/**
 * Main function to update all chain balances
 */
async function updateBalances() {
    console.log('🔄 Fetching WOO token balances from all chains...\n');

    // Load links.json
    const linksPath = path.join(__dirname, '../../woo-quick-links/data/links.json');
    const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));

    // Update each explorer link with fresh balance data
    for (let link of links) {
        if (link.category === 'Explorers' && link.contractAddress) {
            if (link.name === 'Solana') {
                link.tokenBalance = await fetchSolanaTotalSupply(link.contractAddress);
            } else {
                link.tokenBalance = await fetchEVMTotalSupply(link.name, link.contractAddress);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Write updated data back to file
    fs.writeFileSync(linksPath, JSON.stringify(links, null, 4) + '\n');

    console.log('\n✅ Balance update complete! Data saved to links.json');
}

// Run the update
updateBalances().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
