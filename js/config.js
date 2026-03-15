// ===== OPENGRADIENT CONFIGURATION =====
const CONFIG = {
    // Network Configuration (Base Sepolia Testnet)
    NETWORK: {
        CHAIN_ID: 84532,
        CHAIN_ID_HEX: '0x14a34',
        NETWORK_NAME: 'Base Sepolia',
        RPC_URL: 'https://sepolia.base.org',
        EXPLORER_URL: 'https://sepolia.basescan.org',
        CURRENCY_SYMBOL: 'ETH'
    },
    
    // Token Configuration
    TOKEN: {
        SYMBOL: 'OPG',
        CONTRACT_ADDRESS: '0x240b09731D96979f50B2C649C9CE10FcF9C7987F',
        DECIMALS: 18,
        FAUCET_URL: 'https://faucet.opengradient.ai'
    },

    // Demo Mode - NO REAL PAYMENTS (for Discord roles)
    DEMO_MODE: true,
    
    // Available Models
    MODELS: {
        'gpt-4o': {
            name: 'GPT-4o',
            provider: 'OpenAI',
            endpoint: 'openai/gpt-4o'
        },
        'claude-3.5': {
            name: 'Claude 3.5',
            provider: 'Anthropic',
            endpoint: 'anthropic/claude-3-5-sonnet'
        },
        'llama-3-finance': {
            name: 'Llama-3-Finance',
            provider: 'Meta',
            endpoint: 'meta-llama/llama-3-70b-instruct'
        }
    },
    
    // Prediction Categories
    CATEGORIES: {
        crypto: {
            name: 'Crypto Predictions',
            icon: '🪙',
            color: '#F7931A',
            systemPrompt: 'You are a cryptocurrency analysis expert. Provide BUY/HOLD/SELL recommendations with confidence scores (0-100%). ALWAYS include a financial risk disclaimer.'
        },
        sports: {
            name: 'Sports Predictions',
            icon: '⚽',
            color: '#10B981',
            systemPrompt: 'You are a sports analytics expert. Provide predictions for football, hockey, basketball, and tennis with win probabilities and confidence levels.'
        },
        assets: {
            name: 'Assets & Commodities',
            icon: '📈',
            color: '#3B82F6',
            systemPrompt: 'You are a financial markets analyst specializing in commodities (Gold, Oil, Gas) and stocks. Provide price targets and confidence intervals.'
        }
    },
    
    // UI Settings
    UI: {
        DEFAULT_CATEGORY: 'crypto',
        MAX_MESSAGE_LENGTH: 1000,
        AUTO_SCROLL: true
    }
};

window.CONFIG = CONFIG;
