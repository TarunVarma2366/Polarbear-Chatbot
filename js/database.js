/**
 * Database Manager - Handles IndexedDB operations for conversation storage
 */
class DatabaseManager {
  constructor() {
    this.dbName = 'PolarBearChat';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('Database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationStore = db.createObjectStore('conversations', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          conversationStore.createIndex('timestamp', 'timestamp', { unique: false });
          conversationStore.createIndex('sessionId', 'sessionId', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Create analytics store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
          analyticsStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Save a conversation to the database
   */
  async saveConversation(conversation) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      
      const conversationData = {
        ...conversation,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      };

      const request = store.add(conversationData);

      request.onsuccess = () => {
        console.log('Conversation saved successfully');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to save conversation');
        reject(request.error);
      };
    });
  }

  /**
   * Get all conversations
   */
  async getConversations() {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get conversations by session ID
   */
  async getConversationsBySession(sessionId) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations'], 'readonly');
      const store = transaction.objectStore('conversations');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save settings to the database
   */
  async saveSetting(key, value) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key, value, timestamp: new Date().toISOString() });

      request.onsuccess = () => {
        console.log(`Setting ${key} saved successfully`);
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save setting ${key}`);
        reject(request.error);
      };
    });
  }

  /**
   * Get a setting from the database
   */
  async getSetting(key) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Save analytics data
   */
  async saveAnalytics(type, data) {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      
      const analyticsData = {
        type,
        data,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      };

      const request = store.add(analyticsData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Export all data as JSON
   */
  async exportData() {
    if (!this.isInitialized) {
      await this.init();
    }

    const conversations = await this.getConversations();
    const settings = await this.getAllSettings();
    const analytics = await this.getAllAnalytics();

    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      conversations,
      settings,
      analytics
    };
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.getAll();

      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Get all analytics
   */
  async getAllAnalytics() {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['analytics'], 'readonly');
      const store = transaction.objectStore('analytics');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['conversations', 'settings', 'analytics'], 'readwrite');
      
      const clearPromises = [
        transaction.objectStore('conversations').clear(),
        transaction.objectStore('settings').clear(),
        transaction.objectStore('analytics').clear()
      ];

      transaction.oncomplete = () => {
        console.log('All data cleared successfully');
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Generate a unique session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('polarSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('polarSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Get conversation statistics
   */
  async getStats() {
    const conversations = await this.getConversations();
    const analytics = await this.getAllAnalytics();
    
    const stats = {
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + (conv.messages ? conv.messages.length : 0), 0),
      sessionsCount: new Set(conversations.map(conv => conv.sessionId)).size,
      lastActivity: conversations.length > 0 ? 
        new Date(Math.max(...conversations.map(conv => new Date(conv.timestamp)))) : null,
      analyticsEvents: analytics.length
    };

    return stats;
  }
}

// Export for use in other modules
window.DatabaseManager = DatabaseManager;
