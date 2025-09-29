/**
 * Chat Manager - Handles chat functionality, message management, and UI updates
 */
class ChatManager {
  constructor(databaseManager, aiService) {
    this.db = databaseManager;
    this.ai = aiService;
    this.messages = [];
    this.isTyping = false;
    this.autoSave = true;
    this.aiMode = false;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadSettings();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.chatContainer = document.getElementById('chatContainer');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.settingsPanel = document.getElementById('settingsPanel');
    this.aiModeToggle = document.getElementById('aiModeToggle');
    this.autoSaveToggle = document.getElementById('autoSaveToggle');
    this.apiKeyInput = document.getElementById('apiKeyInput');
    this.saveSettingsButton = document.getElementById('saveSettings');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Send message events
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.messageInput.addEventListener('input', () => this.autoResizeTextarea());

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(button => {
      button.addEventListener('click', (e) => {
        const question = e.currentTarget.dataset.question;
        this.messageInput.value = question;
        this.sendMessage();
      });
    });

    // Settings panel
    document.getElementById('settingsButton').addEventListener('click', () => {
      this.toggleSettingsPanel();
    });

    this.saveSettingsButton.addEventListener('click', () => {
      this.saveSettings();
    });

    // Toggle switches
    this.aiModeToggle.addEventListener('click', () => {
      this.toggleAIMode();
    });

    this.autoSaveToggle.addEventListener('click', () => {
      this.toggleAutoSave();
    });

    // Control buttons
    document.getElementById('exportButton').addEventListener('click', () => {
      this.exportConversation();
    });

    document.getElementById('resetButton').addEventListener('click', () => {
      this.resetChat();
    });

    // Close settings panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.settingsPanel.contains(e.target) && 
          !document.getElementById('settingsButton').contains(e.target)) {
        this.settingsPanel.classList.remove('show');
      }
    });
  }

  /**
   * Load settings from database
   */
  async loadSettings() {
    try {
      const aiMode = await this.db.getSetting('aiMode');
      const autoSave = await this.db.getSetting('autoSave');
      const apiKey = await this.db.getSetting('apiKey');

      this.aiMode = aiMode === 'true';
      this.autoSave = autoSave !== 'false'; // Default to true
      
      if (apiKey) {
        this.apiKeyInput.value = apiKey;
        await this.ai.init(apiKey);
        this.updateConnectionStatus();
      }

      this.updateToggleStates();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to database
   */
  async saveSettings() {
    try {
      const apiKey = this.apiKeyInput.value.trim();
      
      if (apiKey) {
        const isValid = await this.ai.init(apiKey);
        if (isValid) {
          await this.db.saveSetting('apiKey', apiKey);
          this.showMessage('Settings saved successfully!', 'success');
        } else {
          this.showMessage('Invalid API key. Please check your OpenAI API key.', 'error');
          return;
        }
      }

      await this.db.saveSetting('aiMode', this.aiMode.toString());
      await this.db.saveSetting('autoSave', this.autoSave.toString());

      this.showMessage('Settings saved successfully!', 'success');
      this.settingsPanel.classList.remove('show');
      this.updateConnectionStatus();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showMessage('Failed to save settings. Please try again.', 'error');
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isTyping) return;

    // Add user message
    this.addMessage(message, true);
    this.messageInput.value = '';
    this.autoResizeTextarea();

    // Show typing indicator
    this.showTyping();

    try {
      let response;
      
      if (this.aiMode && this.ai.isAvailable) {
        // Use AI service
        response = await this.ai.generateResponse(message, this.messages);
      } else {
        // Use fallback responses
        response = this.ai.getFallbackResponse(message);
      }

      // Simulate typing delay
      await this.delay(1000 + Math.random() * 1000);
      
      this.hideTyping();
      this.addMessage(response, false);

      // Save conversation if auto-save is enabled
      if (this.autoSave) {
        await this.saveConversation();
      }

      // Track analytics
      await this.db.saveAnalytics('message_sent', {
        userMessage: message,
        botResponse: response,
        aiMode: this.aiMode,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating response:', error);
      this.hideTyping();
      this.addMessage("I'm having trouble thinking right now. Could you try asking me something else? 🐻‍❄️", false);
    }
  }

  /**
   * Add a message to the chat
   */
  addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();
    
    contentDiv.appendChild(timeDiv);
    messageDiv.appendChild(contentDiv);
    
    // Remove welcome message if it exists
    const welcomeMessage = this.chatContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Store message
    this.messages.push({ 
      role: isUser ? 'user' : 'assistant', 
      content: content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Show typing indicator
   */
  showTyping() {
    this.isTyping = true;
    this.typingIndicator.classList.add('show');
    this.sendButton.disabled = true;
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTyping() {
    this.isTyping = false;
    this.typingIndicator.classList.remove('show');
    this.sendButton.disabled = false;
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  /**
   * Auto-resize textarea
   */
  autoResizeTextarea() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
  }

  /**
   * Toggle settings panel
   */
  toggleSettingsPanel() {
    this.settingsPanel.classList.toggle('show');
  }

  /**
   * Toggle AI mode
   */
  toggleAIMode() {
    this.aiMode = !this.aiMode;
    this.updateToggleStates();
  }

  /**
   * Toggle auto-save
   */
  toggleAutoSave() {
    this.autoSave = !this.autoSave;
    this.updateToggleStates();
  }

  /**
   * Update toggle states
   */
  updateToggleStates() {
    this.aiModeToggle.classList.toggle('active', this.aiMode);
    this.autoSaveToggle.classList.toggle('active', this.autoSave);
  }

  /**
   * Update connection status
   */
  updateConnectionStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (this.ai.isAvailable) {
      this.connectionStatus.textContent = 'AI Connected';
      this.connectionStatus.style.color = '#ffffff';
      statusIndicator.classList.remove('offline');
      statusIndicator.classList.add('ai-connected');
    } else {
      this.connectionStatus.textContent = 'Fallback Mode';
      this.connectionStatus.style.color = '#ffffff';
      statusIndicator.classList.remove('ai-connected');
      statusIndicator.classList.add('offline');
    }
  }

  /**
   * Show message to user
   */
  showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = text;
    
    this.chatContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  /**
   * Save conversation to database
   */
  async saveConversation() {
    try {
      await this.db.saveConversation({
        messages: this.messages,
        sessionId: this.db.getSessionId(),
        aiMode: this.aiMode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  /**
   * Export conversation
   */
  async exportConversation() {
    try {
      const data = await this.db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `polar-bear-conversation-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showMessage('Conversation exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export conversation:', error);
      this.showMessage('Failed to export conversation. Please try again.', 'error');
    }
  }

  /**
   * Reset chat
   */
  async resetChat() {
    if (confirm('Are you sure you want to start a new conversation? This will clear the current chat.')) {
      this.messages = [];
      this.chatContainer.innerHTML = `
        <div class="welcome-message">
          <h3>Welcome to Polar's Arctic World! 🌨️</h3>
          <p>I'm here to help you with your Arctic intake process. Ask me anything about life in the Arctic!</p>
          <div class="quick-actions">
            <div class="quick-action" data-question="What's your name?">
              <i class="fas fa-user"></i> What's your name?
            </div>
            <div class="quick-action" data-question="Where do you live?">
              <i class="fas fa-map-marker-alt"></i> Where do you live?
            </div>
            <div class="quick-action" data-question="What do you eat?">
              <i class="fas fa-fish"></i> What do you eat?
            </div>
            <div class="quick-action" data-question="What are your special skills?">
              <i class="fas fa-star"></i> What are your skills?
            </div>
          </div>
        </div>
      `;
      
      // Re-attach event listeners to quick actions
      document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', (e) => {
          const question = e.currentTarget.dataset.question;
          this.messageInput.value = question;
          this.sendMessage();
        });
      });
      
      this.messageInput.focus();
    }
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other modules
window.ChatManager = ChatManager;
