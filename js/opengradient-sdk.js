// ===== OPENGRADIENT SDK =====
class OpenGradientSDK {
    constructor(config) {
        this.config = config;
        this.provider = null;
        this.account = null;
        this.chainId = null;
    }

    // ===== WALLET CONNECTION =====
    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not found! Please install the browser extension.');
            }

            this.provider = window.ethereum;
            
            const accounts = await this.provider.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.account = accounts[0];
            this.chainId = await this.provider.request({ method: 'eth_chainId' });

            await this.verifyNetwork();
            
            return { 
                success: true, 
                account: this.account,
                chainId: this.chainId
            };
        } catch (error) {
            console.error('Wallet connection error:', error);
            return { success: false, error: error.message };
        }
    }

    // ===== NETWORK VERIFICATION =====
    async verifyNetwork() {
        const requiredChainId = this.config.NETWORK.CHAIN_ID_HEX;
        
        if (this.chainId !== requiredChainId) {
            try {
                await this.provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: requiredChainId }],
                });
                this.chainId = requiredChainId;
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: requiredChainId,
                            chainName: this.config.NETWORK.NETWORK_NAME,
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: [this.config.NETWORK.RPC_URL],
                            blockExplorerUrls: [this.config.NETWORK.EXPLORER_URL]
                        }]
                    });
                } else {
                    throw new Error('Failed to switch network');
                }
            }
        }
    }

    // ===== GET PREDICTION (Simulated for Demo) =====
    async getPrediction(category, message, model = 'gpt-4o') {
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

            const responses = {
                crypto: {
                    prediction: 'BTC/USDT',
                    action: this.getRandomAction(['BUY', 'HOLD', 'SELL']),
                    confidence: Math.floor(Math.random() * 30) + 70,
                    reasoning: 'Technical analysis shows bullish divergence on RSI. Support holding strong at key levels. Institutional accumulation detected on-chain.',
                    priceTarget: '$72,000 - $75,000',
                    timeframe: '7-14 days'
                },
                sports: {
                    prediction: 'Match Winner Analysis',
                    action: this.getRandomAction(['WIN', 'LOSE']),
                    confidence: Math.floor(Math.random() * 25) + 65,
                    reasoning: 'Based on recent form, head-to-head records, and expected goals (xG) data. Home advantage plays a significant factor.',
                    recommendedBet: 'Home Win',
                    odds: '2.10'
                },
                assets: {
                    prediction: 'Gold (XAU/USD)',
                    action: this.getRandomAction(['BUY', 'HOLD', 'SELL']),
                    confidence: Math.floor(Math.random() * 20) + 75,
                    reasoning: 'Macro economic indicators suggest continued strength. Fed policy uncertainty provides support. USD correlation remains key.',
                    priceTarget: '$2,100 - $2,200',
                    timeframe: 'Q3 2026'
                }
            };

            return {
                success: true,
                data: responses[category] || responses.crypto
            };

        } catch (error) {
            console.error('Prediction error:', error);
            return { success: false, error: error.message };
        }
    }

    getRandomAction(actions) {
        return actions[Math.floor(Math.random() * actions.length)];
    }

    // ===== GET BALANCE (Demo) =====
    async getOPGBalance() {
        return (Math.random() * 100 + 50).toFixed(2);
    }
}

window.OpenGradientSDK = OpenGradientSDK;
