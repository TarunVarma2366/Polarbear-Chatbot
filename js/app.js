/**
 * Main Application - Initializes and coordinates all components
 */
class PolarBearApp {
  constructor() {
    this.databaseManager = null;
    this.aiService = null;
    this.chatManager = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Polar Bear Chatbot...');
      
      // Initialize background video
      this.setupBackgroundVideo();
      
      // Initialize database
      this.databaseManager = new DatabaseManager();
      await this.databaseManager.init();
      console.log('Database initialized');

      // Initialize AI service
      this.aiService = new AIService();
      console.log('AI service initialized');

      // Initialize chat manager
      this.chatManager = new ChatManager(this.databaseManager, this.aiService);
      console.log('Chat manager initialized');

      // Load previous conversation if exists
      await this.loadPreviousConversation();

      // Set up global error handling
      this.setupErrorHandling();

      // Set up service worker for offline functionality
      this.setupServiceWorker();

      this.isInitialized = true;
      console.log('Polar Bear Chatbot initialized successfully!');

      // Show welcome message
      this.showWelcomeMessage();

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showErrorMessage('Failed to initialize the application. Please refresh the page.');
    }
  }

  /**
   * Setup background video
   */
  setupBackgroundVideo() {
    const video = document.getElementById('background-video');
    if (video) {
      // Ensure video plays on mobile devices
      video.addEventListener('loadeddata', () => {
        video.play().catch(e => {
          console.log('Video autoplay prevented:', e);
        });
      });
      
      // Handle video loading errors
      video.addEventListener('error', () => {
        console.log('Background video failed to load, using fallback');
        document.body.style.background = 'url("snow-background.jpg") center center / cover no-repeat fixed';
      });
    }
  }

  /**
   * Load previous conversation from database
   */
  async loadPreviousConversation() {
    try {
      const sessionId = this.databaseManager.getSessionId();
      const conversations = await this.databaseManager.getConversationsBySession(sessionId);
      
      if (conversations.length > 0) {
        // Load the most recent conversation
        const latestConversation = conversations[conversations.length - 1];
        if (latestConversation.messages && latestConversation.messages.length > 0) {
          this.chatManager.messages = latestConversation.messages;
          this.displayConversation(latestConversation.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load previous conversation:', error);
    }
  }

  /**
   * Display conversation messages
   */
  displayConversation(messages) {
    // Clear welcome message
    const welcomeMessage = document.getElementById('chatContainer').querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    // Display each message
    messages.forEach(msg => {
      this.chatManager.addMessage(msg.content, msg.role === 'user');
    });
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showErrorMessage('An unexpected error occurred. Please try again.');
    });
  }

  /**
   * Setup service worker for offline functionality
   */
  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
      } catch (error) {
        console.log('Service worker registration failed:', error);
      }
    }
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    // Add a subtle animation to the welcome message
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.style.opacity = '0';
      welcomeMessage.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        welcomeMessage.style.transition = 'all 0.6s ease-out';
        welcomeMessage.style.opacity = '1';
        welcomeMessage.style.transform = 'translateY(0)';
      }, 300);
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const chatContainer = document.getElementById('chatContainer');
    chatContainer.appendChild(errorDiv);
    
    // Remove error message after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 10000);
  }

  /**
   * Get application statistics
   */
  async getStats() {
    if (!this.isInitialized) return null;
    
    try {
      return await this.databaseManager.getStats();
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (!this.isInitialized) return;
    
    try {
      await this.databaseManager.clearAllData();
      await this.chatManager.resetChat();
      this.showMessage('All data cleared successfully!', 'success');
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showMessage('Failed to clear data. Please try again.', 'error');
    }
  }

  /**
   * Show message to user
   */
  showMessage(text, type = 'info') {
    if (this.chatManager) {
      this.chatManager.showMessage(text, type);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new PolarBearApp();
  await app.init();
  
  // Make app globally available for debugging
  window.polarBearApp = app;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden, save current state
    if (window.polarBearApp && window.polarBearApp.chatManager) {
      window.polarBearApp.chatManager.saveConversation();
    }
  } else {
    // Page is visible, update connection status
    if (window.polarBearApp && window.polarBearApp.chatManager) {
      window.polarBearApp.chatManager.updateConnectionStatus();
    }
  }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
  if (window.polarBearApp && window.polarBearApp.chatManager) {
    window.polarBearApp.chatManager.saveConversation();
  }
});

// Export for use in other modules
window.PolarBearApp = PolarBearApp;
