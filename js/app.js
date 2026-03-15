// ===== APPLICATION =====
class GradientPredictApp {
    constructor() {
        this.sdk = new OpenGradientSDK(CONFIG);
        this.currentSection = 'crypto';
        this.selectedAsset = 'BTC';
        this.selectedMatch = null;
        this.isConnected = false;
        this.marketData = null;
        
        this.init();
    }

    init() {
        this.checkWallet();
        this.loadMarketData();
        setInterval(() => this.loadMarketData(), 60000);
        
        // Auto-select first crypto
        this.selectAsset('crypto', 'BTC');
    }

    async checkWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.isConnected = true;
                    this.updateWalletUI(accounts[0]);
                }
            } catch (error) {
                console.error('Check wallet error:', error);
            }
        }
    }

    async connectWallet() {
        const result = await this.sdk.connectWallet();
        if (result.success) {
            this.isConnected = true;
            this.updateWalletUI(result.account);
            this.showNotification('✅ Wallet connected successfully!');
        } else {
            this.showNotification('❌ ' + result.error, 'error');
        }
    }

    updateWalletUI(account) {
        const walletInfo = document.getElementById('walletInfo');
        const connectBtn = document.getElementById('connectWallet');
        const balanceEl = document.getElementById('balance');
        
        walletInfo.style.display = 'flex';
        connectBtn.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
        connectBtn.classList.add('connected');
        balanceEl.textContent = '100.00';
    }

    // Toggle section (collapse/expand)
    toggleSection(sectionName) {
        const section = document.querySelector(`.section[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}-content`);
        
        section.classList.toggle('collapsed');
        content.classList.toggle('active');
    }

    // Select asset (crypto or commodities)
    selectAsset(type, asset) {
        this.currentSection = type;
        this.selectedAsset = asset;
        this.selectedMatch = null;

        // Remove selected from all assets
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selected to current
        const selectedItem = document.querySelector(`.asset-item[data-asset="${asset}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Highlight section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelector(`.section[data-section="${type}"]`)?.classList.add('active');

        const assetName = type === 'crypto' 
            ? CONFIG.ASSETS.crypto[asset].name 
            : CONFIG.ASSETS.commodities[asset].name;

        this.showNotification(`📊 Selected: ${assetName} (${asset})`);
    }

    // Select sports match
    selectMatch(match, league) {
        this.currentSection = 'sports';
        this.selectedMatch = { teams: match, league: league };
        this.selectedAsset = null;

        // Remove selected from all matches
        document.querySelectorAll('.match-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selected to current match
        const selectedMatch = Array.from(document.querySelectorAll('.match-item')).find(
            item => item.textContent.includes(match)
        );
        if (selectedMatch) {
            selectedMatch.classList.add('selected');
        }

        // Highlight section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelector('.section[data-section="sports"]')?.classList.add('active');

        this.showNotification(`⚽ Selected: ${match}`);
    }

    async loadMarketData() {
        // Load crypto prices
        const cryptoPrices = await this.sdk.fetchCryptoPrices();
        this.updateCryptoPrices(cryptoPrices);

        // Load commodity prices
        const commodityPrices = await this.sdk.fetchCommodityPrices();
        this.updateCommodityPrices(commodityPrices);
    }

    updateCryptoPrices(prices) {
        for (const [symbol, data] of Object.entries(prices)) {
            const priceEl = document.querySelector(`#price-${symbol} .price`);
            if (priceEl && data) {
                const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
                const changeSign = data.change24h >= 0 ? '+' : '';
                priceEl.innerHTML = `
                    <div>$${data.price.toLocaleString()}</div>
                    <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                `;
            }
        }
    }

    updateCommodityPrices(prices) {
        for (const [symbol, data] of Object.entries(prices)) {
            const priceEl = document.querySelector(`#price-${symbol} .price`);
            if (priceEl && data) {
                const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
                const changeSign = data.change24h >= 0 ? '+' : '';
                priceEl.innerHTML = `
                    <div>$${data.price.toLocaleString()}</div>
                    <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                `;
            }
        }
    }

    async getPrediction() {
        if (!this.isConnected) {
            this.showNotification('⚠️ Please connect your wallet first!', 'error');
            return;
        }

        const loadingId = this.addLoadingMessage();

        try {
            let result;
            
            if (this.currentSection === 'sports' && this.selectedMatch) {
                result = await this.sdk.getPrediction('sports', null, this.selectedMatch);
            } else if (this.selectedAsset) {
                result = await this.sdk.getPrediction(this.currentSection, this.selectedAsset);
            } else {
                this.removeMessage(loadingId);
                this.showNotification('⚠️ Please select an asset or match!', 'error');
                return;
            }

            this.removeMessage(loadingId);

            if (result.success) {
                this.displayPrediction(result.data);
            } else {
                this.showNotification('Error: ' + result.error, 'error');
            }
        } catch (error) {
            this.removeMessage(loadingId);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    displayPrediction(data) {
        const chatContainer = document.getElementById('chatContainer');
        
        // Clear welcome message if exists
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        let html = '';
        
        if (data.asset) {
            // Crypto or Commodity prediction
            const actionClass = data.action.toLowerCase();
            const actionColor = {
                'buy': '#10B981',
                'hold': '#F59E0B',
                'sell': '#EF4444'
            }[actionClass];

            html = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <div>
                                    <div class="prediction-title">${data.assetName || data.asset}</div>
                                    <div style="color: #5A6B7C; margin-top: 4px;">${data.currentPrice} (${data.change24h})</div>
                                </div>
                                <div class="confidence-score" style="color: ${actionColor}">${data.confidence}%</div>
                            </div>
                            
                            <div class="prediction-recommendation">
                                <span class="recommendation-label">Recommendation:</span>
                                <span class="recommendation-value ${actionClass}">${data.action}</span>
                            </div>

                            <div class="prediction-details">
                                <div class="detail-row">
                                    <span class="detail-label">🎯 Price Target</span>
                                    <span class="detail-value">${data.priceTarget}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">⏱ Timeframe</span>
                                    <span class="detail-value">${data.timeframe}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">⚠️ Risk Level</span>
                                    <span class="detail-value">${data.riskLevel || 'Medium'}</span>
                                </div>
                                ${data.supportLevel ? `
                                <div class="detail-row">
                                    <span class="detail-label">📉 Support</span>
                                    <span class="detail-value">${data.supportLevel}</span>
                                </div>` : ''}
                                ${data.resistanceLevel ? `
                                <div class="detail-row">
                                    <span class="detail-label">📈 Resistance</span>
                                    <span class="detail-value">${data.resistanceLevel}</span>
                                </div>` : ''}
                            </div>

                            <div class="prediction-reasoning">
                                <strong>📊 Technical Analysis:</strong><br>
                                ${data.reasoning}
                            </div>

                            ${data.indicators ? `
                            <div class="prediction-details" style="margin-top: 16px;">
                                <div class="detail-row">
                                    <span class="detail-label">RSI (14)</span>
                                    <span class="detail-value">${data.indicators.rsi}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">MACD</span>
                                    <span class="detail-value">${data.indicators.macd}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Volume</span>
                                    <span class="detail-value">${data.indicators.volume}</span>
                                </div>
                            </div>` : ''}

                            <div class="prediction-actions">
                                <button class="btn-action" onclick="app.copyPrediction()">📋 Copy</button>
                                <button class="btn-action" onclick="app.sharePrediction()">📤 Share</button>
                                <button class="btn-action" onclick="app.savePrediction()">💾 Save</button>
                            </div>

                            <div class="disclaimer">
                                ⚠️ This is not financial advice. Always do your own research (DYOR).
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (data.match) {
            // Sports prediction
            html = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <div>
                                    <div class="prediction-title">${data.match}</div>
                                    <div style="color: #5A6B7C; margin-top: 4px;">${data.league}</div>
                                </div>
                                <div class="confidence-score">${data.confidence}%</div>
                            </div>

                            <div class="prediction-recommendation">
                                <span class="recommendation-label">Prediction:</span>
                                <span class="recommendation-value buy">${data.prediction} (${data.winProbability})</span>
                            </div>

                            <div class="prediction-reasoning">
                                <strong>📊 Match Analysis:</strong><br>
                                ${data.reasoning}
                            </div>

                            ${data.recommendedBet ? `
                            <div class="prediction-details" style="margin-top: 16px;">
                                <div class="detail-row">
                                    <span class="detail-label">💰 Recommended Bet</span>
                                    <span class="detail-value">${data.recommendedBet}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">📊 Odds</span>
                                    <span class="detail-value">${data.odds}</span>
                                </div>
                                ${data.alternativeBet ? `
                                <div class="detail-row">
                                    <span class="detail-label">🔄 Alternative</span>
                                    <span class="detail-value">${data.alternativeBet}</span>
                                </div>` : ''}
                            </div>` : ''}

                            <div class="prediction-actions">
                                <button class="btn-action" onclick="app.copyPrediction()">📋 Copy</button>
                                <button class="btn-action" onclick="app.sharePrediction()">📤 Share</button>
                                <button class="btn-action" onclick="app.savePrediction()">💾 Save</button>
                            </div>

                            <div class="disclaimer">
                                ⚠️ Bet responsibly. Gambling involves risk.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        messageDiv.innerHTML = html;
        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        if (!message) return;

        const chatContainer = document.getElementById('chatContainer');
        
        // Remove welcome message
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-bubble">${message}</div>
            </div>
        `;
        chatContainer.appendChild(userMsg);
        
        input.value = '';
        this.scrollToBottom();

        // Show tip
        setTimeout(() => {
            this.showNotification('💡 Tip: Click "Get AI Prediction" for detailed analysis');
        }, 500);
    }

    addLoadingMessage() {
        const id = 'loading-' + Date.now();
        const chatContainer = document.getElementById('chatContainer');
        
        // Remove welcome message
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message';
        loadingDiv.id = id;
        loadingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <p style="text-align: center; margin-top: 12px; color: #5A6B7C;">
                        Analyzing market data and generating prediction...
                    </p>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(loadingDiv);
        this.scrollToBottom();
        return id;
    }

    removeMessage(id) {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 80px;
            right: 32px;
            padding: 16px 24px;
            background: ${type === 'error' ? '#EF4444' : '#40D1DB'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notif.textContent = message;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    copyPrediction() {
        this.showNotification('📋 Prediction copied to clipboard!');
    }

    sharePrediction() {
        this.showNotification('📤 Share dialog opened!');
    }

    savePrediction() {
        this.showNotification('💾 Prediction saved!');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GradientPredictApp();
});
