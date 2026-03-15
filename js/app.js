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
            balanceDisplay: document.getElementById('opgBalance'),
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            modelSelect: document.getElementById('modelSelect'),
            categories: document.querySelectorAll('.chat-category')
        };
    }

    bindEvents() {
        this.dom.connectBtn.addEventListener('click', () => this.connectWallet());
        
        this.dom.categories.forEach(category => {
            category.addEventListener('click', (e) => {
                const targetCategory = e.currentTarget.dataset.category;
                this.switchCategory(targetCategory);
            });
        });

        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
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
                    this.dom.connectBtn.textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
                    this.dom.connectBtn.disabled = true;
                    this.updateBalance();
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
            this.dom.connectBtn.textContent = `${result.account.slice(0, 6)}...${result.account.slice(-4)}`;
            this.dom.connectBtn.disabled = true;
            this.dom.connectBtn.classList.add('connected');
            await this.updateBalance();
            this.addSystemMessage('✅ Кошелёк подключён! Сеть: Base Sepolia Testnet');
            this.addSystemMessage('💡 Для запросов потребуется подпись транзакции (x402)');
        } else {
            this.addErrorMessage('Ошибка подключения: ' + result.error);
        }
    }

    async updateBalance() {
        const balance = await this.sdk.getOPGBalance();
        this.dom.balanceDisplay.textContent = balance;
    }

    // ===== CATEGORY SWITCHING =====
    switchCategory(category) {
        this.currentCategory = category;
        
        this.dom.categories.forEach(cat => {
            cat.classList.remove('active');
            if (cat.dataset.category === category) {
                cat.classList.add('active');
            }
        });

        const categoryName = CONFIG.CATEGORIES[category].name;
        const color = CONFIG.CATEGORIES[category].color;
        
        this.addSystemMessage(`📊 Переключено на: <span style="color: ${color}">${categoryName}</span>`);
    }

    // ===== MESSAGING =====
    async sendMessage() {
        const message = this.dom.messageInput.value.trim();
        if (!message) return;

        if (!this.isConnected) {
            this.addErrorMessage('⚠️ Сначала подключите кошелёк!');
            return;
        }

        this.addMessage('user', message);
        this.dom.messageInput.value = '';

        const loadingId = this.addLoadingMessage();

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
                this.addErrorMessage(result.error || 'Неизвестная ошибка');
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
                    <p style="margin-top: 10px; font-size: 0.875rem;">Обработка запроса через OpenGradient...</p>
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
                        <p><strong>Рекомендация:</strong> <span style="color: ${actionColor}; font-weight: 700; font-size: 1.1rem;">${data.action}</span></p>
                        <p style="margin-top: 10px; line-height: 1.5;">${data.reasoning}</p>
                        ${data.priceTarget ? `<p style="margin-top: 10px;"><strong>🎯 Цель:</strong> ${data.priceTarget}</p>` : ''}
                        ${data.timeframe ? `<p><strong>⏱ Срок:</strong> ${data.timeframe}</p>` : ''}
                        ${data.odds ? `<p><strong>📊 Коэффициент:</strong> ${data.odds}</p>` : ''}
                        <p style="margin-top: 15px; font-size: 0.75rem; color: var(--text-tertiary); border-top: 1px solid var(--border-light); padding-top: 10px;">
                            ⚠️ Это не финансовая рекомендация. Проводите собственное исследование (DYOR).
                        </p>
                    </div>
                    <div class="prediction-actions">
                        <button class="btn-action">📊 Детали</button>
                        <button class="btn-action">🔔 Уведомление</button>
                        <button class="btn-action">📤 Поделиться</button>
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
                    <p style="color: #DC2626;"><strong>Ошибка:</strong> ${error}</p>
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
    window.app = new GradientPredictApp();
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
        background: #10B981;
        cursor: default;
    }
    .btn-connect.connected:hover {
        transform: none;
    }
`;
document.head.appendChild(style);
