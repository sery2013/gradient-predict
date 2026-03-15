// ===== APPLICATION LOGIC =====
class GradientPredictApp {
    constructor() {
        this.sdk = new OpenGradientSDK(CONFIG);
        this.currentCategory = CONFIG.UI.DEFAULT_CATEGORY;
        this.selectedAsset = CONFIG.UI.DEFAULT_ASSET;
        this.selectedMatch = null;
        this.isConnected = false;
        this.marketData = null;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkWallet();
        this.loadMarketData();
        setInterval(() => this.loadMarketData(), 60000); // Update every minute
    }

    cacheDOM() {
        this.dom = {
            connectBtn: document.getElementById('connectWalletBtn'),
            walletStatus: document.getElementById('walletStatus'),
            walletBalance: document.getElementById('walletBalance'),
            balanceDisplay: document.getElementById('opgBalance'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            predictionBtn: document.getElementById('predictionBtn'),
            modelSelect: document.getElementById('modelSelect'),
            categories: document.querySelectorAll('.chat-category'),
            cryptoSelector: document.getElementById('cryptoSelector'),
            sportSelector: document.getElementById('sportSelector'),
            commoditySelector: document.getElementById('commoditySelector')
        };
    }

    bindEvents() {
        // Wallet
        this.dom.connectBtn.addEventListener('click', () => this.connectWallet());

        // Categories
        this.dom.categories.forEach(category => {
            category.addEventListener('click', (e) => {
                const cat = e.currentTarget.closest('.chat-category');
                if (cat) {
                    this.switchCategory(cat.dataset.category);
                }
            });
        });

        // Crypto assets
        if (this.dom.cryptoSelector) {
            this.dom.cryptoSelector.addEventListener('click', (e) => {
                const assetItem = e.target.closest('.asset-item');
                if (assetItem) {
                    this.selectCrypto(assetItem.dataset.asset);
                }
            });
        }

        // Sports matches
        if (this.dom.sportSelector) {
            this.dom.sportSelector.addEventListener('click', (e) => {
                const teamItem = e.target.closest('.team-item');
                if (teamItem) {
                    this.selectMatch(teamItem.dataset.match, teamItem.dataset.league);
                }
            });
        }

        // Commodities
        if (this.dom.commoditySelector) {
            this.dom.commoditySelector.addEventListener('click', (e) => {
                const assetItem = e.target.closest('.asset-item');
                if (assetItem) {
                    this.selectCommodity(assetItem.dataset.asset);
                }
            });
        }

        // Buttons
        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
        this.dom.predictionBtn.addEventListener('click', () => this.getPrediction());
        this.dom.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
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
            this.addSystemMessage('✅ Wallet connected successfully!');
        } else {
            this.addErrorMessage('Connection error: ' + result.error);
        }
    }

    updateWalletUI(account) {
        this.dom.connectBtn.textContent = `${account.slice(0, 6)}...${account.slice(-4)}`;
        this.dom.connectBtn.disabled = true;
        this.dom.connectBtn.classList.add('connected');
        this.dom.walletStatus.style.display = 'flex';
        this.dom.walletBalance.style.display = 'flex';
        this.dom.balanceDisplay.textContent = '100.00';
    }

    async loadMarketData() {
        if (this.currentCategory === 'crypto') {
            this.marketData = await this.sdk.fetchCryptoPrices();
            this.updatePriceDisplays('crypto');
        } else if (this.currentCategory === 'assets') {
            this.marketData = await this.sdk.fetchCommodityPrices();
            this.updatePriceDisplays('commodities');
        }
    }

    updatePriceDisplays(type) {
        if (!this.marketData) return;

        if (type === 'crypto') {
            for (const [symbol, data] of Object.entries(this.marketData)) {
                const priceEl = document.getElementById(`price-${symbol}`);
                if (priceEl) {
                    const changeClass = data.change24h >= 0 ? 'price-up' : 'price-down';
                    const changeSign = data.change24h >= 0 ? '+' : '';
                    priceEl.innerHTML = `
                        <div class="price-value">$${data.price.toLocaleString()}</div>
                        <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                    `;
                }
            }
        } else if (type === 'commodities') {
            for (const [symbol, data] of Object.entries(this.marketData)) {
                const priceEl = document.getElementById(`price-${symbol}`);
                if (priceEl) {
                    const changeClass = data.change24h >= 0 ? 'price-up' : 'price-down';
                    const changeSign = data.change24h >= 0 ? '+' : '';
                    priceEl.innerHTML = `
                        <div class="price-value">$${data.price.toLocaleString()}</div>
                        <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                    `;
                }
            }
        }
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        this.dom.categories.forEach(cat => {
            cat.classList.remove('active');
        });
        
        const activeCategory = document.getElementById(`category-${category}`);
        if (activeCategory) {
            activeCategory.classList.add('active');
        }

        const categoryName = CONFIG.CATEGORIES[category].name;
        const color = CONFIG.CATEGORIES[category].color;
        
        this.addSystemMessage(`📊 Switched to: <span style="color: ${color}">${categoryName}</span>`);
        this.loadMarketData();
    }

    selectCrypto(asset) {
        this.selectedAsset = asset;
        this.selectedMatch = null;
        
        // Update UI
        document.querySelectorAll('#cryptoSelector .asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`#cryptoSelector .asset-item[data-asset="${asset}"]`)?.classList.add('selected');

        const assetInfo = CONFIG.ASSETS.crypto[asset];
        this.addSystemMessage(`🪙 Selected: <span style="color: ${CONFIG.CATEGORIES.crypto.color}">${assetInfo.name} (${asset})</span>`);
    }

    selectCommodity(asset) {
        this.selectedAsset = asset;
        this.selectedMatch = null;
        
        document.querySelectorAll('#commoditySelector .asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`#commoditySelector .asset-item[data-asset="${asset}"]`)?.classList.add('selected');

        this.addSystemMessage(`📈 Selected: <span style="color: ${CONFIG.CATEGORIES.assets.color}">${asset}</span>`);
    }

    selectMatch(match, league) {
        this.selectedMatch = { teams: match, league: league };
        this.selectedAsset = null;
        
        document.querySelectorAll('#sportSelector .team-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`#sportSelector .team-item[data-match="${match}"]`)?.classList.add('selected');

        this.addSystemMessage(`⚽ Selected Match: <span style="color: ${CONFIG.CATEGORIES.sports.color}">${match} (${league})</span>`);
    }

    async getPrediction() {
        if (!this.isConnected) {
            this.addErrorMessage('⚠️ Please connect your wallet first!');
            return;
        }

        const loadingId = this.addLoadingMessage();

        try {
            let result;
            
            if (this.currentCategory === 'sports' && this.selectedMatch) {
                result = await this.sdk.getPrediction(
                    'sports',
                    null,
                    this.selectedMatch,
                    this.dom.modelSelect.value
                );
            } else if (this.selectedAsset) {
                result = await this.sdk.getPrediction(
                    this.currentCategory,
                    this.selectedAsset,
                    null,
                    this.dom.modelSelect.value
                );
            } else {
                this.removeMessage(loadingId);
                this.addErrorMessage('⚠️ Please select an asset or match first!');
                return;
            }

            this.removeMessage(loadingId);

            if (result.success) {
                this.displayPrediction(result.data);
            } else {
                this.addErrorMessage(result.error || 'Unknown error');
            }
        } catch (error) {
            this.removeMessage(loadingId);
            this.addErrorMessage(error.message);
        }
    }

    async sendMessage() {
        const message = this.dom.messageInput.value.trim();
        if (!message) return;

        this.addMessage('user', message);
        this.dom.messageInput.value = '';

        const loadingId = this.addLoadingMessage();
        await new Promise(resolve => setTimeout(resolve, 1500));
        this.removeMessage(loadingId);
        
        this.addSystemMessage('💡 Tip: Click "Get AI Prediction" button for detailed analysis');
    }

    displayPrediction(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';

        let content = '';
        
        if (data.asset) {
            // Crypto or Commodity prediction
            const actionColor = {
                'BUY': '#10B981',
                'HOLD': '#F59E0B',
                'SELL': '#EF4444'
            }[data.action] || '#40D1DB';

            content = `
                <div class="prediction-card">
                    <div class="prediction-header">
                        <span class="prediction-title">${data.assetName || data.asset}</span>
                        <span class="confidence-score" style="color: ${actionColor}">${data.confidence}%</span>
                    </div>
                    <div class="prediction-price">
                        <span class="current-price">${data.currentPrice}</span>
                        <span class="price-change ${data.change24h.includes('+') ? 'positive' : 'negative'}">${data.change24h}</span>
                    </div>
                    <p><strong>Recommendation:</strong> <span style="color: ${actionColor}; font-weight: 700; font-size: 1.2rem;">${data.action}</span></p>
                    <p style="margin-top: 10px; line-height: 1.5;">${data.reasoning}</p>
                    ${data.priceTarget ? `<p style="margin-top: 10px;"><strong>🎯 Target:</strong> ${data.priceTarget}</p>` : ''}
                    ${data.timeframe ? `<p><strong>⏱ Timeframe:</strong> ${data.timeframe}</p>` : ''}
                    ${data.riskLevel ? `<p><strong>⚠️ Risk Level:</strong> ${data.riskLevel}</p>` : ''}
                    <p style="margin-top: 15px; font-size: 0.75rem; color: var(--text-tertiary); border-top: 1px solid var(--border-light); padding-top: 10px;">
                        ⚠️ This is not financial advice. Always do your own research (DYOR).
                    </p>
                </div>
                <div class="prediction-actions">
                    <button class="btn-action">📊 Chart</button>
                    <button class="btn-action">🔔 Alert</button>
                    <button class="btn-action">📤 Share</button>
                </div>
            `;
        } else if (data.match) {
            // Sports prediction
            content = `
                <div class="prediction-card">
                    <div class="prediction-header">
                        <span class="prediction-title">${data.match}</span>
                        <span class="confidence-score">${data.confidence}%</span>
                    </div>
                    <p style="margin-top: 5px; color: var(--text-secondary);">${data.league}</p>
                    <p style="margin-top: 10px;"><strong>Prediction:</strong> <span style="color: #10B981; font-weight: 700;">${data.prediction} to Win (${data.winProbability})</span></p>
                    <p style="margin-top: 10px; line-height: 1.5;">${data.reasoning}</p>
                    ${data.recommendedBet ? `<p style="margin-top: 10px;"><strong>💰 Recommended Bet:</strong> ${data.recommendedBet} @ ${data.odds}</p>` : ''}
                    ${data.alternativeBet ? `<p><strong>Alternative:</strong> ${data.alternativeBet}</p>` : ''}
                    <p style="margin-top: 15px; font-size: 0.75rem; color: var(--text-tertiary); border-top: 1px solid var(--border-light); padding-top: 10px;">
                        ⚠️ Bet responsibly. Gambling involves risk.
                    </p>
                </div>
                <div class="prediction-actions">
                    <button class="btn-action">📊 Stats</button>
                    <button class="btn-action">🔔 Notify</button>
                    <button class="btn-action">📤 Share</button>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient">
                    <span>🤖</span>
                </div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    ${content}
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.id = `msg-${Date.now()}`;

        const avatar = type === 'bot' ? '🤖' : '👤';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient">
                    <span>${avatar}</span>
                </div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>${content}</p>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv.id;
    }

    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.style.opacity = '0.7';

        messageDiv.innerHTML = `
            <div class="message-content" style="max-width: 100%;">
                <div class="message-bubble" style="background: var(--bg-tertiary); border: none;">
                    <p style="text-align: center; font-style: italic; font-size: 0.9rem;">${content}</p>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addLoadingMessage() {
        const id = `loading-${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = id;

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient">
                    <span>🤖</span>
                </div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="loading-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <p style="margin-top: 10px; font-size: 0.875rem;">Analyzing market data and generating prediction...</p>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return id;
    }

    addErrorMessage(error) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
                    <span>⚠️</span>
                </div>
            </div>
            <div class="message-content">
                <div class="message-bubble" style="border-left: 4px solid #EF4444; background: #FEF2F2;">
                    <p style="color: #DC2626;"><strong>Error:</strong> ${error}</p>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeMessage(id) {
        const message = document.getElementById(id);
        if (message) message.remove();
    }

    scrollToBottom() {
        if (CONFIG.UI.AUTO_SCROLL) {
            this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;
        }
    }
}

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('GradientPredict App Initializing...');
    window.app = new GradientPredictApp();
    console.log('App initialized successfully');
});

// ===== CSS STYLES =====
const style = document.createElement('style');
style.textContent = `
    .loading-dots {
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
    }
    .loading-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--og-primary);
        animation: bounce 1.4s infinite ease-in-out;
    }
    .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
    .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    
    .btn-connect.connected {
        background: #10B981 !important;
        cursor: default;
    }
    
    .asset-selector, .sport-league-selector {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .asset-item, .team-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--bg-tertiary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .asset-item:hover, .team-item:hover {
        background: var(--bg-secondary);
        border-color: var(--og-primary-light);
        transform: translateX(4px);
    }
    
    .asset-item.selected, .team-item.selected {
        background: linear-gradient(135deg, rgba(64, 209, 219, 0.15) 0%, rgba(111, 224, 232, 0.15) 100%);
        border-color: var(--og-primary);
        font-weight: 600;
    }
    
    .asset-icon, .team-name {
        font-size: 0.9rem;
    }
    
    .asset-price {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 0.85rem;
    }
    
    .price-value {
        font-weight: 600;
    }
    
    .price-change {
        font-size: 0.75rem;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 2px;
    }
    
    .price-change.price-up {
        background: #D1FAE5;
        color: #10B981;
    }
    
    .price-change.price-down {
        background: #FEE2E2;
        color: #EF4444;
    }
    
    .league-section {
        margin-bottom: 12px;
    }
    
    .league-section h4 {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 6px;
        padding-left: 4px;
    }
    
    .match-time {
        font-size: 0.75rem;
        color: var(--text-tertiary);
    }
    
    .btn-prediction {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: linear-gradient(135deg, var(--og-primary) 0%, var(--og-primary-dark) 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-prediction:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 209, 219, 0.4);
    }
    
    .category-header {
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    
    .prediction-price {
        display: flex;
        align-items: baseline;
        gap: 10px;
        margin: 10px 0;
    }
    
    .current-price {
        font-size: 1.5rem;
        font-weight: 700;
    }
    
    .price-change.positive {
        color: #10B981;
        font-weight: 600;
    }
    
    .price-change.negative {
        color: #EF4444;
        font-weight: 600;
    }
`;
document.head.appendChild(style);
