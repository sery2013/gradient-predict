// ===== GLOBAL APP =====
let app;

class GradientPredictApp {
    constructor() {
        this.sdk = new OpenGradientSDK(CONFIG);
        this.currentSection = 'crypto';
        this.selectedAsset = 'BTC';
        this.selectedMatch = null;
        this.isConnected = false;
        this.walletAddress = null;
        
        console.log('🚀 Initializing GradientPredict App...');
        this.init();
    }

    init() {
        console.log('📌 Setting up event listeners...');
        this.setupWalletButton();
        this.setupSectionToggles();
        this.setupAssetSelection();
        this.setupMatchSelection();
        this.setupGetPredictionButton();
        this.setupSendMessage();
        
        console.log('📌 Loading initial data...');
        this.loadMarketData();
        setInterval(() => this.loadMarketData(), 30000);
        
        // Open crypto section by default
        this.openSection('crypto');
        
        console.log('✅ App initialized successfully');
    }

    // ===== WALLET =====
    setupWalletButton() {
        const connectBtn = document.getElementById('connectWallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
        this.checkExistingConnection();
    }

    async checkExistingConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.setConnected(accounts[0]);
                }
            } catch (error) {
                console.error('Error checking connection:', error);
            }
        }
    }

    async connectWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask is not installed');
            }

            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            await this.switchToBaseSepolia();
            this.setConnected(accounts[0]);
            this.showNotification('✅ Wallet connected!', 'success');
            
        } catch (error) {
            console.error('Wallet error:', error);
            this.showNotification('Connection failed: ' + error.message, 'error');
        }
    }

    async switchToBaseSepolia() {
        const chainId = '0x14a34';
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainId }]
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: chainId,
                        chainName: 'Base Sepolia',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://sepolia.base.org'],
                        blockExplorerUrls: ['https://sepolia.basescan.org']
                    }]
                });
            }
        }
    }

    setConnected(address) {
        this.isConnected = true;
        this.walletAddress = address;
        
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const balanceEl = document.getElementById('balance');
        
        if (connectBtn) {
            connectBtn.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
            connectBtn.classList.add('connected');
            connectBtn.disabled = true;
        }
        
        if (walletInfo) {
            walletInfo.style.display = 'flex';
        }
        
        if (balanceEl) {
            balanceEl.textContent = '100.00';
        }
    }

    // ===== SECTION TOGGLES - ИСПРАВЛЕНО =====
    setupSectionToggles() {
        const sections = document.querySelectorAll('.section[data-section]');
        console.log(`📑 Found ${sections.length} sections`);
        
        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            const sectionName = section.dataset.section;
            
            if (header) {
                // Remove old listeners by cloning
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
                
                newHeader.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`📂 Clicked section: ${sectionName}`);
                    this.toggleSection(sectionName);
                });
            }
        });
    }

    toggleSection(sectionName) {
        console.log(`🔄 Toggle section: ${sectionName}`);
        
        try {
            const section = document.querySelector(`.section[data-section="${sectionName}"]`);
            const content = document.getElementById(`${sectionName}-content`);
            
            if (!section || !content) {
                console.error(`Section not found: ${sectionName}`);
                return;
            }
            
            // Check if this section is currently active
            const isActive = section.classList.contains('active-section');
            
            // Close all sections first
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active-section');
                s.classList.add('collapsed');
            });
            document.querySelectorAll('.section-content').forEach(c => {
                c.classList.remove('active');
            });
            
            // If it wasn't active before, open it
            if (!isActive) {
                section.classList.add('active-section');
                section.classList.remove('collapsed');
                content.classList.add('active');
                this.currentSection = sectionName;
                console.log(`✅ Opened section: ${sectionName}`);
            } else {
                console.log(`ℹ️ Section ${sectionName} was already active, keeping it open`);
                // Keep it open
                section.classList.add('active-section');
                section.classList.remove('collapsed');
                content.classList.add('active');
            }
            
        } catch (error) {
            console.error('Error toggling section:', error);
        }
    }

    openSection(sectionName) {
        console.log(`📂 Opening section: ${sectionName}`);
        const section = document.querySelector(`.section[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}-content`);
        
        if (section && content) {
            // Close all others
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active-section');
                s.classList.add('collapsed');
            });
            document.querySelectorAll('.section-content').forEach(c => {
                c.classList.remove('active');
            });
            
            // Open this one
            section.classList.add('active-section');
            section.classList.remove('collapsed');
            content.classList.add('active');
            this.currentSection = sectionName;
        }
    }

    // ===== ASSET SELECTION =====
    setupAssetSelection() {
        const assetItems = document.querySelectorAll('.asset-item');
        console.log(`💎 Found ${assetItems.length} asset items`);
        
        assetItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const asset = item.dataset.asset;
                const section = item.closest('.section');
                const type = section ? section.dataset.section : 'crypto';
                console.log(`💰 Asset clicked: ${asset} (${type})`);
                this.selectAsset(type, asset);
            });
        });
    }

    selectAsset(type, asset) {
        console.log(`Selecting: ${type} - ${asset}`);
        this.currentSection = type;
        this.selectedAsset = asset;
        this.selectedMatch = null;

        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`.asset-item[data-asset="${asset}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Make sure section is open
        this.openSection(type);

        const assetName = type === 'crypto' 
            ? (CONFIG.ASSETS.crypto[asset]?.name || asset)
            : (CONFIG.ASSETS.commodities[asset]?.name || asset);

        this.showNotification(`💎 Selected: ${assetName}`);
    }

    // ===== MATCH SELECTION =====
    setupMatchSelection() {
        const matchItems = document.querySelectorAll('.match-item');
        console.log(`⚽ Found ${matchItems.length} matches`);
        
        matchItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const teamsEl = item.querySelector('.match-teams');
                if (teamsEl) {
                    this.selectMatch(teamsEl.textContent, 'League');
                }
            });
        });
    }

    selectMatch(match, league) {
        console.log(`Selecting match: ${match}`);
        this.currentSection = 'sports';
        this.selectedMatch = { teams: match, league: league };
        this.selectedAsset = null;

        document.querySelectorAll('.match-item').forEach(item => {
            item.classList.remove('selected');
        });

        document.querySelectorAll('.match-item').forEach(item => {
            if (item.querySelector('.match-teams')?.textContent === match) {
                item.classList.add('selected');
            }
        });

        this.openSection('sports');
        this.showNotification(`⚽ Match: ${match}`);
    }

    // ===== PREDICTION =====
    setupGetPredictionButton() {
        const predictBtn = document.getElementById('getPrediction');
        if (predictBtn) {
            predictBtn.addEventListener('click', () => this.getPrediction());
        }
    }

    async getPrediction() {
        console.log('🎯 Getting prediction...');
        
        if (!this.isConnected) {
            this.showNotification('⚠️ Connect wallet first!', 'warning');
            await this.connectWallet();
            return;
        }

        if (!this.selectedAsset && !this.selectedMatch) {
            this.showNotification('⚠️ Select an asset or match!', 'warning');
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
                throw new Error('Nothing selected');
            }

            this.removeMessage(loadingId);

            if (result && result.success) {
                this.displayPrediction(result.data);
            } else {
                throw new Error(result?.error || 'Error');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            this.removeMessage(loadingId);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    // ===== MESSAGES =====
    setupSendMessage() {
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (input && sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input?.value.trim();
        if (!message) return;

        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(message)}</div>
            </div>
        `;
        chatContainer.appendChild(userMsg);
        
        if (input) input.value = '';
        this.scrollToBottom();

        setTimeout(() => {
            this.showNotification('💡 Click "Get AI Prediction" for analysis');
        }, 500);
    }

    // ===== MARKET DATA =====
    async loadMarketData() {
        try {
            const cryptoPrices = await this.sdk.fetchCryptoPrices();
            this.updateCryptoPrices(cryptoPrices);

            const commodityPrices = await this.sdk.fetchCommodityPrices();
            this.updateCommodityPrices(commodityPrices);
        } catch (error) {
            console.error('Market data error:', error);
        }
    }

    updateCryptoPrices(prices) {
        if (!prices) return;
        
        for (const [symbol, data] of Object.entries(prices)) {
            const priceEl = document.querySelector(`#price-${symbol} .price`);
            if (priceEl && data) {
                const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
                const changeSign = data.change24h >= 0 ? '+' : '';
                priceEl.innerHTML = `
                    <div style="font-weight: 600;">$${data.price.toLocaleString()}</div>
                    <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                `;
            }
        }
    }

    updateCommodityPrices(prices) {
        if (!prices) return;
        
        for (const [symbol, data] of Object.entries(prices)) {
            const priceEl = document.querySelector(`#price-${symbol} .price`);
            if (priceEl && data) {
                const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
                const changeSign = data.change24h >= 0 ? '+' : '';
                priceEl.innerHTML = `
                    <div style="font-weight: 600;">$${data.price.toLocaleString()}</div>
                    <div class="price-change ${changeClass}">${changeSign}${data.change24h.toFixed(2)}%</div>
                `;
            }
        }
    }

    // ===== DISPLAY PREDICTION =====
    displayPrediction(data) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        if (data.asset) {
            const actionClass = data.action.toLowerCase();
            const actionColor = {
                'buy': '#10B981',
                'hold': '#F59E0B',
                'sell': '#EF4444'
            }[actionClass] || '#40D1DB';

            messageDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <div class="prediction-card">
                            <div class="prediction-header">
                                <div>
                                    <div class="prediction-title">${data.assetName || data.asset}</div>
                                    <div style="color: #5A6B7C; margin-top: 4px; font-size: 14px;">
                                        ${data.currentPrice} <span style="color: ${data.change24h.includes('+') ? '#10B981' : '#EF4444'}">(${data.change24h})</span>
                                    </div>
                                </div>
                                <div class="confidence-score" style="color: ${actionColor}">${data.confidence}%</div>
                            </div>
                            
                            <div class="prediction-recommendation" style="margin: 16px 0;">
                                <span style="font-weight: 600;">Recommendation:</span>
                                <span style="font-size: 24px; font-weight: 700; margin-left: 8px; color: ${actionColor}">${data.action}</span>
                            </div>

                            <div style="margin-top: 16px;">
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0F4F5;">
                                    <span style="color: #5A6B7C;">🎯 Price Target</span>
                                    <span style="font-weight: 600;">${data.priceTarget}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F0F4F5;">
                                    <span style="color: #5A6B7C;">⏱ Timeframe</span>
                                    <span style="font-weight: 600;">${data.timeframe}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <span style="color: #5A6B7C;">⚠️ Risk</span>
                                    <span style="font-weight: 600;">${data.riskLevel || 'Medium'}</span>
                                </div>
                            </div>

                            <div style="margin-top: 16px; padding: 16px; background: #F8FAFB; border-radius: 8px; line-height: 1.6;">
                                <strong>📊 Analysis:</strong><br>
                                ${data.reasoning}
                            </div>

                            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E8EDEF; font-size: 12px; color: #8A9BAC; text-align: center;">
                                ⚠️ Not financial advice. DYOR.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (data.match) {
            messageDiv.innerHTML = `
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

                            <div style="margin: 16px 0;">
                                <span style="font-weight: 600;">Prediction:</span>
                                <span style="font-size: 20px; font-weight: 700; margin-left: 8px; color: #10B981;">${data.prediction}</span>
                            </div>

                            <div style="margin-top: 16px; padding: 16px; background: #F8FAFB; border-radius: 8px; line-height: 1.6;">
                                ${data.reasoning}
                            </div>

                            ${data.recommendedBet ? `
                            <div style="margin-top: 16px;">
                                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                                    <span style="color: #5A6B7C;">💰 Bet</span>
                                    <span style="font-weight: 600;">${data.recommendedBet} @ ${data.odds}</span>
                                </div>
                            </div>` : ''}

                            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #E8EDEF; font-size: 12px; color: #8A9BAC; text-align: center;">
                                ⚠️ Bet responsibly.
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // ===== UTILITIES =====
    addLoadingMessage() {
        const id = 'loading-' + Date.now();
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return id;
        
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message';
        loadingDiv.id = id;
        loadingDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div style="display: flex; gap: 6px; justify-content: center; padding: 20px;">
                        <span style="width: 10px; height: 10px; background: #40D1DB; border-radius: 50%; animation: bounce 1.4s infinite;"></span>
                        <span style="width: 10px; height: 10px; background: #40D1DB; border-radius: 50%; animation: bounce 1.4s infinite 0.16s;"></span>
                        <span style="width: 10px; height: 10px; background: #40D1DB; border-radius: 50%; animation: bounce 1.4s infinite 0.32s;"></span>
                    </div>
                    <p style="text-align: center; margin-top: 12px; color: #5A6B7C;">Analyzing...</p>
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
        const notif = document.createElement('div');
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#40D1DB'
        };
        
        notif.style.cssText = `
            position: fixed;
            top: 80px;
            right: 32px;
            padding: 16px 24px;
            background: ${colors[type] || colors.info};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    .section.collapsed .section-content {
        display: none !important;
    }
    .section-content.active {
        display: block !important;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    app = new GradientPredictApp();
    window.app = app;
});
