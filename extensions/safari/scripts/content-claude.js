/**
 * Content Script for Claude.ai
 * Handles envelope detection and copying from Claude's responses
 */

class ClaudeBridge {
  constructor() {
    this.init();
  }

  init() {
    console.log('[AI Crosstalk] Claude bridge initialized');
    this.setupMessageListener();
  }

  /**
   * Find Claude's input field
   */
  findInputField() {
    const selectors = [
      'div[contenteditable="true"][data-testid="message-input"]',
      'div[contenteditable="true"]',
      'textarea'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  /**
   * Get the last Claude response
   */
  getLastClaudeMessage() {
    // Claude uses different DOM structure
    const messages = document.querySelectorAll('[data-testid="message"]');

    // Find last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const isUser = message.querySelector('[data-testid="user-message"]');

      if (!isUser) {
        return message.textContent;
      }
    }

    return null;
  }

  /**
   * Copy envelope from Claude's response
   */
  async copyEnvelope() {
    const lastMessage = this.getLastClaudeMessage();

    if (!lastMessage) {
      this.showNotification('No Claude response found', 'error');
      return { success: false, error: 'No message found' };
    }

    if (!EnvelopeParser.hasEnvelope(lastMessage)) {
      this.showNotification('No envelope found in response', 'warning');
      return { success: false, error: 'No envelope in message' };
    }

    const envelope = EnvelopeParser.findLastEnvelope(lastMessage);

    if (!envelope || !envelope.valid) {
      this.showNotification('Invalid envelope format', 'error');
      return { success: false, error: 'Invalid envelope' };
    }

    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(envelope.raw);
      this.showNotification('Envelope copied to clipboard!', 'success');

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'ENVELOPE_COPIED',
        envelope: envelope
      });

      return { success: true, envelope: envelope };
    } catch (error) {
      this.showNotification('Failed to copy to clipboard', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info', duration = 2000) {
    const existing = document.getElementById('ai-crosstalk-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'ai-crosstalk-notification';
    notification.textContent = message;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), duration);
  }

  /**
   * Setup message listener
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'COPY_ENVELOPE') {
        this.copyEnvelope().then(sendResponse);
        return true;
      }

      if (message.type === 'GET_STATUS') {
        sendResponse({
          platform: 'claude'
        });
        return false;
      }
    });
  }
}

// Initialize the bridge
const bridge = new ClaudeBridge();
