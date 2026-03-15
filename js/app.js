// ===== APPLICATION LOGIC =====
class GradientPredictApp {
    constructor() {
        this.sdk = new OpenGradientSDK(CONFIG);
        this.currentCategory = CONFIG.UI.DEFAULT_CATEGORY;
        this.isConnected = false;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.checkWallet();
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
            modelSelect: document.getElementById('modelSelect'),
            categories: document.querySelectorAll('.chat-category')
        };
    }

    bindEvents() {
        // Wallet connection
        this.dom.connectBtn.addEventListener('click', () => this.connectWallet());

        // Category selection - FIXED: Using proper event delegation
        this.dom.categories.forEach((category, index) => {
            category.style.cursor = 'pointer';
            category.addEventListener('click', (e) => {
                console.log('Category clicked:', index, category.dataset.category);
                const targetCategory = category.dataset.category;
                this.switchCategory(targetCategory);
            });
        });

        // Send message
        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
        this.dom.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        console.log('Events bound successfully');
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

    // ===== WALLET CONNECTION =====
    async connectWallet() {
        const result = await this.sdk.connectWallet();
        
        if (result.success) {
            this.isConnected = true;
            this.updateWalletUI(result.account);
            this.addSystemMessage('✅ Wallet connected successfully!');
            this.addSystemMessage('💡 Demo mode: No real payments required');
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

    // ===== CATEGORY SWITCHING - FIXED =====
    switchCategory(category) {
        console.log('Switching to category:', category);
        this.currentCategory = category;
        
        // Remove active class from ALL categories
        this.dom.categories.forEach(cat => {
            cat.classList.remove('active');
        });
        
        // Add active class to selected category
        const selectedCategory = document.getElementById(`category-${category}`);
        if (selectedCategory) {
            selectedCategory.classList.add('active');
            console.log('Active category set:', category);
        }

        // Add system message
        const categoryName = CONFIG.CATEGORIES[category].name;
        const color = CONFIG.CATEGORIES[category].color;
        
        this.addSystemMessage(`📊 Switched to: <span style="color: ${color}">${categoryName}</span>`);
        
        // Clear chat and show category-specific welcome
        this.showCategoryWelcome(category);
    }

    showCategoryWelcome(category) {
        const welcomes = {
            crypto: '🪙 Ask me about Bitcoin, Ethereum, or any cryptocurrency!',
            sports: '⚽ Ask me about football, hockey, basketball, or tennis predictions!',
            assets: '📈 Ask me about Gold, Oil, Gas, or stock market predictions!'
        };
        
        this.addSystemMessage(welcomes[category] || welcomes.crypto);
    }

    // ===== MESSAGING =====
    async sendMessage() {
        const message = this.dom.messageInput.value.trim();
        if (!message) return;

        if (!this.isConnected) {
            this.addErrorMessage('⚠️ Please connect your wallet first!');
            return;
        }

        // Add user message
        this.addMessage('user', message);
        this.dom.messageInput.value = '';

        // Show loading
        const loadingId = this.addLoadingMessage();

        // Get prediction
        const selectedModel = this.dom.modelSelect.value;
        
        try {
            const result = await this.sdk.getPrediction(
                this.currentCategory,
                message,
                selectedModel
            );

            this.removeMessage(loadingId);

            if (result.success) {
                this.addPredictionMessage(result.data);
            } else {
                this.addErrorMessage(result.error || 'Unknown error occurred');
            }
        } catch (error) {
            this.removeMessage(loadingId);
            this.addErrorMessage(error.message);
        }
    }

    // ===== UI HELPERS =====
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
                    <p style="margin-top: 10px; font-size: 0.875rem;">Generating prediction...</p>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        return id;
    }

    addPredictionMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';

        const actionColors = {
            'BUY': '#10B981',
            'HOLD': '#F59E0B',
            'SELL': '#EF4444',
            'WIN': '#10B981',
            'LOSE': '#EF4444'
        };
        
        const actionColor = actionColors[data.action] || '#40D1DB';

        messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-gradient">
                    <span>🤖</span>
                </div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="prediction-card">
                        <div class="prediction-header">
                            <span class="prediction-title">${data.prediction}</span>
                            <span class="confidence-score" style="color: ${actionColor}">${data.confidence}%</span>
                        </div>
                        <p><strong>Recommendation:</strong> <span style="color: ${actionColor}; font-weight: 700; font-size: 1.1rem;">${data.action}</span></p>
                        <p style="margin-top: 10px; line-height: 1.5;">${data.reasoning}</p>
                        ${data.priceTarget ? `<p style="margin-top: 10px;"><strong>🎯 Target:</strong> ${data.priceTarget}</p>` : ''}
                        ${data.timeframe ? `<p><strong>⏱ Timeframe:</strong> ${data.timeframe}</p>` : ''}
                        ${data.odds ? `<p><strong>📊 Odds:</strong> ${data.odds}</p>` : ''}
                        <p style="margin-top: 15px; font-size: 0.75rem; color: var(--text-tertiary); border-top: 1px solid var(--border-light); padding-top: 10px;">
                            ⚠️ This is not financial advice. Always do your own research (DYOR).
                        </p>
                    </div>
                    <div class="prediction-actions">
                        <button class="btn-action">📊 Details</button>
                        <button class="btn-action">🔔 Notify</button>
                        <button class="btn-action">📤 Share</button>
                    </div>
                </div>
            </div>
        `;

        this.dom.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
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

// ===== LOADING ANIMATION CSS =====
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
    .btn-connect.connected:hover {
        transform: none;
    }
    
    .chat-category {
        cursor: pointer !important;
        user-select: none;
    }
    
    .chat-category:hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);
