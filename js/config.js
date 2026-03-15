// ===== OPENGRADIENT WEB3 CONFIGURATION =====
const CONFIG = {
    // Network Configuration (Base Sepolia Testnet)
    NETWORK: {
        CHAIN_ID: 84532,
        CHAIN_ID_HEX: '0x14a34', // 84532 in hex
        NETWORK_NAME: 'Base Sepolia',
        RPC_URL: 'https://sepolia.base.org',
        EXPLORER_URL: 'https://sepolia.basescan.org',
        CURRENCY_SYMBOL: 'ETH'
    },
    
    // Token Configuration ($OPG on Base Sepolia)
    TOKEN: {
        SYMBOL: 'OPG',
        CONTRACT_ADDRESS: '0x240b09731D96979f50B2C649C9CE10FcF9C7987F',
        DECIMALS: 18,
        FAUCET_URL: 'https://faucet.opengradient.ai'
    },

    // x402 Payment Protocol Configuration
    X402: {
        GATEWAY_URL: 'https://gateway.opengradient.ai',
        PAYMENT_REQUIRED_CODE: 402,
        MAX_PRICE: '1000000000000000', // Max price in wei we accept
        SCHEME: 'exact'
    },
    
    // Available Models (OpenGradient Model Hub)
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
    
    // Prediction Categories & System Prompts
    CATEGORIES: {
        crypto: {
            name: 'Crypto Predictions',
            icon: '🪙',
            systemPrompt: 'You are a cryptocurrency analysis expert connected to OpenGradient. Provide BUY/HOLD/SELL recommendations with confidence scores (0-100%). Base analysis on technical indicators, market sentiment, and on-chain data. ALWAYS include a financial risk disclaimer.',
            color: '#F7931A'
        },
        sports: {
            name: 'Sports Predictions',
            icon: '⚽',
            systemPrompt: 'You are a sports analytics expert. Provide predictions for football, hockey, basketball, and tennis. Include win probabilities, recommended bets, and confidence levels. Remind users that sports betting involves risk.',
            color: '#10B981'
        },
        assets: {
            name: 'Assets & Commodities',
            icon: '📈',
            systemPrompt: 'You are a financial markets analyst specializing in commodities (Gold, Oil, Gas) and stocks. Provide price targets, trend direction, and confidence intervals. Include macroeconomic context.',
            color: '#3B82F6'
        }
    },
    
    // UI Settings
    UI: {
        DEFAULT_CATEGORY: 'crypto',
        MAX_MESSAGE_LENGTH: 1000,
        AUTO_SCROLL: true,
        PAYMENT_AMOUNT: '0.01' // OPG tokens per request (testnet)
    }
};

window.CONFIG = CONFIG;
