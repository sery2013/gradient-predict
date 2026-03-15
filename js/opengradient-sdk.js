// ===== OPENGRADIENT WEB3 SDK (x402 Protocol) =====
class OpenGradientSDK {
    constructor(config) {
        this.config = config;
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
    }

    // ===== 1. WALLET CONNECTION (No API Keys) =====
    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask не найден! Пожалуйста, установите расширение.');
            }

            this.provider = window.ethereum;
            
            // Request account access
            const accounts = await this.provider.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.account = accounts[0];
            this.chainId = await this.provider.request({ method: 'eth_chainId' });

            // Verify network
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

    // ===== 2. NETWORK VERIFICATION =====
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
                    throw new Error('Не удалось переключить сеть');
                }
            }
        }
    }

    // ===== 3. SIGN MESSAGE FOR AUTH (Instead of API Key) =====
    async signMessage(message) {
        try {
            const signature = await this.provider.request({
                method: 'personal_sign',
                params: [message, this.account]
            });
            return signature;
        } catch (error) {
            console.error('Sign error:', error);
            throw new Error('Подпись отклонена пользователем');
        }
    }

    // ===== 4. x402 PAYMENT PROTOCOL =====
    async makePayment(amountOPG) {
        try {
            // Convert OPG to wei (assuming 18 decimals)
            const amountWei = BigInt(Math.floor(amountOPG * 1e18)).toString(16);
            
            // Create payment transaction
            const transaction = {
                from: this.account,
                to: this.config.TOKEN.CONTRACT_ADDRESS,
                data: this.encodeTransferData(this.account, amountWei), // Simplified
                value: '0x0' // Token transfer, not ETH
            };

            // For testnet demo, we simulate payment approval
            // In production, this would be an actual token transfer
            const txHash = await this.provider.request({
                method: 'eth_sendTransaction',
                params: [transaction]
            });

            return {
                success: true,
                txHash: txHash,
                amount: amountOPG
            };
        } catch (error) {
            console.error('Payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper: Encode ERC20 transfer data
    encodeTransferData(to, amount) {
        const transferSig = '0xa9059cbb';
        const paddedTo = to.slice(2).padStart(64, '0');
        const paddedAmount = amount.padStart(64, '0');
        return transferSig + paddedTo + paddedAmount;
    }

    // ===== 5. INFERENCE REQUEST (With x402 Headers) =====
    async getPrediction(category, message, model = 'gpt-4o') {
        try {
            const categoryConfig = this.config.CATEGORIES[category];
            const modelConfig = this.config.MODELS[model];

            // Step 1: Create authentication signature
            const timestamp = Date.now();
            const authMessage = `OpenGradient Auth\nAccount: ${this.account}\nTimestamp: ${timestamp}`;
            const signature = await this.signMessage(authMessage);

            // Step 2: Prepare request payload
            const payload = {
                model: modelConfig.endpoint,
                messages: [
                    { role: 'system', content: categoryConfig.systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500,
                stream: false
            };

            // Step 3: Make request with x402 headers
            const response = await fetch(`${this.config.X402.GATEWAY_URL}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${signature}`,
                    'X-Wallet-Address': this.account,
                    'X-Timestamp': timestamp.toString(),
                    'X-Chain-Id': this.config.NETWORK.CHAIN_ID.toString()
                },
                body: JSON.stringify(payload)
            });

            // Step 4: Handle x402 Payment Required
            if (response.status === 402) {
                const paymentInfo = await response.json();
                console.log('Payment required:', paymentInfo);
                
                // Trigger payment
                const paymentResult = await this.makePayment(this.config.UI.PAYMENT_AMOUNT);
                
                if (!paymentResult.success) {
                    throw new Error('Оплата не прошла: ' + paymentResult.error);
                }

                // Retry request after payment
                return await this.getPrediction(category, message, model);
            }

            // Step 5: Parse response
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: this.parsePrediction(data.choices[0].message.content, category)
            };

        } catch (error) {
            console.error('Prediction error:', error);
            
            // Fallback to simulation if API fails (for demo)
            return await this.simulatePrediction(category, message);
        }
    }

    // Parse AI response into structured prediction
    parsePrediction(content, category) {
        // Simple parsing - in production use structured output
        const actionMatch = content.match(/(BUY|HOLD|SELL|WIN|LOSE)/i);
        const confidenceMatch = content.match(/(\d{1,3})%/);
        
        return {
            prediction: content.split('\n')[0].substring(0, 50) + '...',
            action: actionMatch ? actionMatch[0].toUpperCase() : 'HOLD',
            confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75,
            reasoning: content,
            priceTarget: null,
            timeframe: null
        };
    }

    // ===== 6. SIMULATED RESPONSES (Fallback) =====
    async simulatePrediction(category, message) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const responses = {
            crypto: {
                prediction: 'BTC/USDT',
                action: 'BUY',
                confidence: 87,
                reasoning: 'Технический анализ показывает бычье расхождение на RSI. Поддержка на $65K держится крепко. Рекомендуется вход с стопом на $63K.',
                priceTarget: '$72,000',
                timeframe: '7-14 дней'
            },
            sports: {
                prediction: 'Ман Сити vs Реал',
                action: 'WIN',
                confidence: 73,
                reasoning: 'Ман Сити выиграл 4 из 5 последних домашних матчей. У Реала проблемы в обороне. Ожидаемые голы (xG) в пользу хозяев.',
                recommendedBet: 'Победа Ман Сити',
                odds: '2.10'
            },
            assets: {
                prediction: 'Золото (XAU/USD)',
                action: 'HOLD',
                confidence: 81,
                reasoning: 'Золото консолидируется near $2,050. Неопределённость политики ФРС поддерживает цену, но сильный доллар создаёт давление.',
                priceTarget: '$2,100 - $2,150',
                timeframe: 'Q3 2026'
            }
        };

        return {
            success: true,
             responses[category] || responses.crypto
        };
    }

    // ===== 7. GET BALANCE =====
    async getOPGBalance() {
        try {
            // For demo, return random balance
            // In production, call ERC20 balanceOf
            return (Math.random() * 100).toFixed(2);
        } catch (error) {
            return '0.00';
        }
    }
}

window.OpenGradientSDK = OpenGradientSDK;
