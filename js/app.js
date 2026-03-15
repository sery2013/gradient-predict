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
        this.conversationHistory = []; // История переписки
        
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
            
            // Add welcome message after connection
            this.addBotMessage('Great! Your wallet is connected. Select an asset and click "Get AI Prediction" or ask me anything!');
            
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

    // ===== SECTION TOGGLES =====
    setupSectionToggles() {
        const sections = document.querySelectorAll('.section[data-section]');
        console.log(`📑 Found ${sections.length} sections`);
        
        sections.forEach(section => {
            const header = section.querySelector('.section-header');
            const sectionName = section.dataset.section;
            
            if (header) {
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);
                
                newHeader.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSection(sectionName);
                });
            }
        });
    }

    toggleSection(sectionName) {
        console.log(`🔄 Toggle section: ${sectionName}`);
        
        const section = document.querySelector(`.section[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}-content`);
        
        if (!section || !content) {
            console.error(`Section not found: ${sectionName}`);
            return;
        }
        
        const isActive = section.classList.contains('active-section');
        
        document.querySelectorAll('.section').forEach(s => {
            s.classList.remove('active-section');
            s.classList.add('collapsed');
        });
        document.querySelectorAll('.section-content').forEach(c => {
            c.classList.remove('active');
        });
        
        if (!isActive) {
            section.classList.add('active-section');
            section.classList.remove('collapsed');
            content.classList.add('active');
            this.currentSection = sectionName;
        } else {
            section.classList.add('active-section');
            section.classList.remove('collapsed');
            content.classList.add('active');
        }
    }

    openSection(sectionName) {
        const section = document.querySelector(`.section[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}-content`);
        
        if (section && content) {
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active-section');
                s.classList.add('collapsed');
            });
            document.querySelectorAll('.section-content').forEach(c => {
                c.classList.remove('active');
            });
            
            section.classList.add('active-section');
            section.classList.remove('collapsed');
            content.classList.add('active');
            this.currentSection = sectionName;
        }
    }

    // ===== ASSET SELECTION =====
    setupAssetSelection() {
        const assetItems = document.querySelectorAll('.asset-item');
        
        assetItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const asset = item.dataset.asset;
                const section = item.closest('.section');
                const type = section ? section.dataset.section : 'crypto';
                this.selectAsset(type, asset);
            });
        });
    }

    selectAsset(type, asset) {
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

        this.openSection(type);

        const assetName = type === 'crypto' 
            ? (CONFIG.ASSETS.crypto[asset]?.name || asset)
            : (CONFIG.ASSETS.commodities[asset]?.name || asset);

        this.showNotification(`💎 Selected: ${assetName}`);
        
        // Add message about selection
        this.addBotMessage(`Great choice! ${assetName} is selected. Click "Get AI Prediction" for detailed analysis or ask me a question about ${asset}!`);
    }

    // ===== MATCH SELECTION =====
    setupMatchSelection() {
        const matchItems = document.querySelectorAll('.match-item');
        
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
        this.addBotMessage(`Match selected: ${match}. Click "Get AI Prediction" for analysis or ask me about the teams!`);
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
        
        if (!this.selectedAsset && !this.selectedMatch) {
            this.showNotification('⚠️ Select an asset or match first!', 'warning');
            this.addBotMessage('Please select a cryptocurrency, commodity, or sports match from the left sidebar first!');
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
                this.addToHistory('prediction', result.data);
                
                // Add follow-up suggestions
                setTimeout(() => {
                    this.addFollowUpSuggestions(result.data);
                }, 500);
            } else {
                throw new Error(result?.error || 'Error');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            this.removeMessage(loadingId);
            this.showNotification('Error: ' + error.message, 'error');
            this.addBotMessage('Sorry, I encountered an error. Please try again!');
        }
    }

    // ===== SEND MESSAGE - ИСПРАВЛЕНО! =====
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

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input?.value.trim();
        if (!message) return;

        // Remove welcome message
        const chatContainer = document.getElementById('chatContainer');
        const welcomeMsg = chatContainer?.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        // Add user message
        this.addUserMessage(message);
        if (input) input.value = '';
        this.scrollToBottom();

        // Add to history
        this.addToHistory('user', message);

        // Show loading
        const loadingId = this.addLoadingMessage();

        // Get bot response
        try {
            const response = await this.getBotResponse(message);
            this.removeMessage(loadingId);
            this.addBotMessage(response);
            this.addToHistory('bot', response);
        } catch (error) {
            this.removeMessage(loadingId);
            this.addBotMessage('Sorry, I had trouble processing that. Please try again!');
        }

        this.scrollToBottom();
    }

    // ===== BOT RESPONSES =====
    async getBotResponse(userMessage) {
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const msg = userMessage.toLowerCase();

        // Check for specific topics
        if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
            return this.getPriceResponse();
        }
        
        if (msg.includes('buy') || msg.includes('sell') || msg.includes('hold') || msg.includes('recommend')) {
            return this.getRecommendationResponse();
        }
        
        if (msg.includes('when') || msg.includes('time') || msg.includes('long')) {
            return this.getTimeframeResponse();
        }
        
        if (msg.includes('risk') || msg.includes('safe') || msg.includes('danger')) {
            return this.getRiskResponse();
        }
        
        if (msg.includes('help') || msg.includes('what can')) {
            return this.getHelpResponse();
        }
        
        if (msg.includes('thank')) {
            return "You're welcome! Feel free to ask more questions about your selected asset or get another prediction! 🚀";
        }
        
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            return "Hello! 👋 I'm your AI prediction assistant. Select an asset from the left and click 'Get AI Prediction' for detailed analysis, or ask me anything about crypto, sports, or commodities!";
        }

        // Default response with context
        return this.getContextualResponse(userMessage);
    }

    getPriceResponse() {
        const asset = this.selectedAsset ? 
            (CONFIG.ASSETS.crypto[this.selectedAsset]?.name || this.selectedAsset) : 
            'the selected asset';
        
        return `Based on current market data, ${asset} is showing interesting price action. For the most accurate and up-to-date price, click "Get AI Prediction" - I'll analyze real-time data including 24h change, support/resistance levels, and price targets! 📊`;
    }

    getRecommendationResponse() {
        return `For personalized BUY/HOLD/SELL recommendations, I need to analyze current market conditions. Click "Get AI Prediction" and I'll provide:
        
✅ Current price & 24h change
✅ Confidence score (0-100%)
✅ Price targets
✅ Risk assessment
✅ Technical indicators

Would you like me to generate a prediction now?`;
    }

    getTimeframeResponse() {
        return `My predictions typically cover:
        
📅 Short-term: 7-14 days
📅 Medium-term: 1-3 months
📅 Long-term: Q2-Q3 2026

For specific timeframe analysis on your selected asset, click "Get AI Prediction"!`;
    }

    getRiskResponse() {
        return `⚠️ Important: All investments carry risk! My predictions include:

• Risk Level assessment (Low/Medium/High)
• Support & Resistance levels
• Confidence scores
• Technical analysis

Remember: Never invest more than you can afford to lose. Always DYOR (Do Your Own Research)!`;
    }

    getHelpResponse() {
        return `🤖 Here's what I can help you with:

1️⃣ **Get Predictions**: Select an asset → Click "Get AI Prediction"
2️⃣ **Price Analysis**: Ask about price, targets, levels
3️⃣ **Recommendations**: Ask about BUY/HOLD/SELL
4️⃣ **Risk Assessment**: Ask about risk levels
5️⃣ **Sports Predictions**: Select a match → Get analysis

💡 Tip: Click on any cryptocurrency, commodity, or sports match in the left sidebar to get started!`;
    }

    getContextualResponse(userMessage) {
        const asset = this.selectedAsset ? 
            (CONFIG.ASSETS.crypto[this.selectedAsset]?.name || this.selectedAsset) : 
            'an asset';

        return `That's a great question about "${userMessage}"! 

For the most accurate analysis about ${asset}, I recommend clicking **"Get AI Prediction"** which will provide:

📊 Real-time market data
🎯 Price targets & timeframes
⚠️ Risk assessment
💡 Technical indicators

Or feel free to ask me specific questions about:
• Price analysis
• Buy/Sell recommendations
• Risk levels
• Market trends

What would you like to know?`;
    }

    addFollowUpSuggestions(predictionData) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'follow-up-suggestions';
        suggestionsDiv.style.cssText = `
            margin: 16px 0;
            padding: 16px;
            background: #F8FAFB;
            border-radius: 12px;
            border: 1px solid #E8EDEF;
        `;

        const asset = predictionData.assetName || predictionData.asset || 'this asset';
        
        suggestionsDiv.innerHTML = `
            <p style="margin-bottom: 12px; font-weight: 600; color: #5A6B7C;">💡 Follow-up questions you can ask:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button class="suggestion-btn" onclick="app.askSuggestion('What is the support level for ${asset}?')" style="padding: 8px 16px; background: white; border: 1px solid #40D1DB; border-radius: 20px; cursor: pointer; font-size: 13px; color: #40D1DB;">📉 Support Level</button>
                <button class="suggestion-btn" onclick="app.askSuggestion('Should I buy ${asset} now?')" style="padding: 8px 16px; background: white; border: 1px solid #40D1DB; border-radius: 20px; cursor: pointer; font-size: 13px; color: #40D1DB;">💰 Should I Buy?</button>
                <button class="suggestion-btn" onclick="app.askSuggestion('What is the risk level?')" style="padding: 8px 16px; background: white; border: 1px solid #40D1DB; border-radius: 20px; cursor: pointer; font-size: 13px; color: #40D1DB;">⚠️ Risk Level</button>
                <button class="suggestion-btn" onclick="app.askSuggestion('What are the technical indicators?')" style="padding: 8px 16px; background: white; border: 1px solid #40D1DB; border-radius: 20px; cursor: pointer; font-size: 13px; color: #40D1DB;">📊 Technical Analysis</button>
            </div>
        `;

        chatContainer.appendChild(suggestionsDiv);
        this.scrollToBottom();
    }

    askSuggestion(question) {
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = question;
            this.sendMessage();
        }
    }

    // ===== MESSAGES =====
    addUserMessage(content) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(content)}</div>
            </div>
        `;
        chatContainer.appendChild(userMsg);
    }

    addBotMessage(content) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;

        // Remove welcome message if exists
        const welcomeMsg = chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();

        const botMsg = document.createElement('div');
        botMsg.className = 'message';
        botMsg.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">${this.escapeHtml(content)}</div>
            </div>
        `;
        chatContainer.appendChild(botMsg);
    }

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
                    <p style="text-align: center; margin-top: 12px; color: #5A6B7C;">Thinking...</p>
                </div>
            </div>
        `;
        
        chatContainer.appendChild(loadingDiv);
        return id;
    }

    removeMessage(id) {
        const msg = document.getElementById(id);
        if (msg) msg.remove();
    }

    // ===== HISTORY =====
    addToHistory(type, content) {
        this.conversationHistory.push({
            type: type,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Keep last 50 messages
        if (this.conversationHistory.length > 50) {
            this.conversationHistory.shift();
        }
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
    .suggestion-btn:hover {
        background: #40D1DB !important;
        color: white !important;
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    app = new GradientPredictApp();
    window.app = app;
});
