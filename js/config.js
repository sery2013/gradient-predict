// ===== OPENGRADIENT CONFIGURATION =====
const CONFIG = {
    // Network Configuration
    NETWORK: {
        CHAIN_ID: 84532,
        CHAIN_ID_HEX: '0x14a34',
        NETWORK_NAME: 'Base Sepolia',
        RPC_URL: 'https://sepolia.base.org',
        EXPLORER_URL: 'https://sepolia.basescan.org'
    },
    
    // Token Configuration
    TOKEN: {
        SYMBOL: 'OPG',
        CONTRACT_ADDRESS: '0x240b09731D96979f50B2C649C9CE10FcF9C7987F',
        DECIMALS: 18,
        FAUCET_URL: 'https://faucet.opengradient.ai'
    },

    // Demo Mode
    DEMO_MODE: true,
    
    // API Endpoints for Real Data
    APIS: {
        COINGECKO: 'https://api.coingecko.com/api/v3',
        CRYPTO_COMPARE: 'https://min-api.cryptocompare.com/data',
        METALS: 'https://metals-api.com/api'
    },
    
    // Available Models
    MODELS: {
        'gpt-4o': { name: 'GPT-4o', provider: 'OpenAI' },
        'claude-3.5': { name: 'Claude 3.5', provider: 'Anthropic' },
        'llama-3-finance': { name: 'Llama-3-Finance', provider: 'Meta' }
    },
    
    // Assets Configuration
    ASSETS: {
        crypto: {
            BTC: { name: 'Bitcoin', symbol: 'BTC', coingeckoId: 'bitcoin', icon: '₿' },
            ETH: { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum', icon: 'Ξ' },
            SOL: { name: 'Solana', symbol: 'SOL', coingeckoId: 'solana', icon: '◎' },
            BNB: { name: 'BNB', symbol: 'BNB', coingeckoId: 'binancecoin', icon: 'B' },
            XRP: { name: 'XRP', symbol: 'XRP', coingeckoId: 'ripple', icon: 'X' },
            ADA: { name: 'Cardano', symbol: 'ADA', coingeckoId: 'cardano', icon: '₳' },
            DOGE: { name: 'Dogecoin', symbol: 'DOGE', coingeckoId: 'dogecoin', icon: 'Ð' },
            DOT: { name: 'Polkadot', symbol: 'DOT', coingeckoId: 'polkadot', icon: '●' }
        },
        commodities: {
            GOLD: { name: 'Gold', symbol: 'XAU', icon: '🥇' },
            SILVER: { name: 'Silver', symbol: 'XAG', icon: '🥈' },
            OIL: { name: 'Crude Oil WTI', symbol: 'WTI', icon: '🛢' },
            GAS: { name: 'Natural Gas', symbol: 'NG', icon: '🔥' },
            COPPER: { name: 'Copper', symbol: 'HG', icon: '🔧' },
            PLATINUM: { name: 'Platinum', symbol: 'XPT', icon: '⚪' }
        },
        sports: {
            football: {
                name: 'Football',
                icon: '⚽',
                matches: [
                    { teams: 'Man City vs Real Madrid', league: 'UCL', time: 'Today 20:00' },
                    { teams: 'Arsenal vs Bayern', league: 'UCL', time: 'Today 20:00' },
                    { teams: 'Liverpool vs Chelsea', league: 'EPL', time: 'Tomorrow 17:30' },
                    { teams: 'Barcelona vs PSG', league: 'UCL', time: 'Tomorrow 20:00' }
                ]
            },
            hockey: {
                name: 'Hockey (NHL)',
                icon: '🏒',
                matches: [
                    { teams: 'Bruins vs Rangers', league: 'NHL', time: 'Today 19:00' },
                    { teams: 'Maple Leafs vs Panthers', league: 'NHL', time: 'Today 19:30' },
                    { teams: 'Avalanche vs Stars', league: 'NHL', time: 'Tomorrow 01:00' }
                ]
            },
            basketball: {
                name: 'Basketball (NBA)',
                icon: '🏀',
                matches: [
                    { teams: 'Lakers vs Warriors', league: 'NBA', time: 'Tomorrow 03:00' },
                    { teams: 'Celtics vs Bucks', league: 'NBA', time: 'Tomorrow 00:30' },
                    { teams: 'Nuggets vs Suns', league: 'NBA', time: 'Tomorrow 02:00' }
                ]
            },
            tennis: {
                name: 'Tennis (ATP)',
                icon: '🎾',
                matches: [
                    { teams: 'Djokovic vs Alcaraz', league: 'ATP Finals', time: 'Today 14:00' },
                    { teams: 'Sinner vs Medvedev', league: 'ATP Finals', time: 'Today 18:00' }
                ]
            }
        }
    },
    
    // Categories
    CATEGORIES: {
        crypto: {
            name: 'Crypto Predictions',
            icon: '🪙',
            color: '#F7931A'
        },
        sports: {
            name: 'Sports Predictions',
            icon: '⚽',
            color: '#10B981'
        },
        assets: {
            name: 'Assets & Commodities',
            icon: '📈',
            color: '#3B82F6'
        }
    },
    
    // UI Settings
    UI: {
        DEFAULT_CATEGORY: 'crypto',
        DEFAULT_ASSET: 'BTC',
        MAX_MESSAGE_LENGTH: 1000,
        AUTO_SCROLL: true
    }
};

window.CONFIG = CONFIG;
