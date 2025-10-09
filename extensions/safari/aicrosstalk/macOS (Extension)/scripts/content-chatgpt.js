/**
 * Content Script for ChatGPT - Safari Compatible
 * Handles envelope pasting, submission, and response detection
 */

// Safari compatibility: Use browser or chrome API
const extensionAPI = (typeof browser !== 'undefined') ? browser :
                     (typeof chrome !== 'undefined') ? chrome : null;

console.log('[Content] browser available:', typeof browser);
console.log('[Content] chrome available:', typeof chrome);
console.log('[Content] Using API:', extensionAPI === browser ? 'browser' : extensionAPI === chrome ? 'chrome' : 'none');

if (!extensionAPI) {
  console.error('[AI Crosstalk] Extension API not available');
}

class ChatGPTBridge {
  constructor() {
    this.isProcessing = false;
    this.responseObserver = null;
    this.lastMessageCount = 0;
    this.init();
  }

  init() {
    console.log('[AI Crosstalk] ChatGPT bridge initialized');
    this.setupMessageListener();
    this.countMessages();
  }

  /**
   * Find the ChatGPT input textarea
   */
  findInputField() {
    // ChatGPT uses a contenteditable div, try multiple selectors
    const selectors = [
      '#prompt-textarea',
      '[data-id="root"] textarea',
      'textarea[placeholder*="Message"]',
      'div[contenteditable="true"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  /**
   * Find the submit button
   */
  findSubmitButton() {
    const selectors = [
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'form button[type="submit"]',
      'button svg[class*="send"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && !element.disabled) return element;
    }

    return null;
  }

  /**
   * Count current messages in the conversation
   */
  countMessages() {
    const messages = document.querySelectorAll('[data-message-author-role]');
    this.lastMessageCount = messages.length;
    return messages.length;
  }

  /**
   * Get the last assistant message
   */
  getLastAssistantMessage() {
    const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
    if (messages.length === 0) return null;

    const lastMessage = messages[messages.length - 1];
    return lastMessage.textContent;
  }

  /**
   * Read clipboard and paste envelope
   */
  async pasteFromClipboard() {
    try {
      // Read clipboard directly in content script (has user gesture context)
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText) {
        this.showNotification('Clipboard is empty', 'warning');
        return { success: false, error: 'Clipboard empty' };
      }

      console.log('[AI Crosstalk] Clipboard text length:', clipboardText.length);

      // Check if it's an envelope
      if (!clipboardText.includes('[[') || !clipboardText.includes('[[END]]')) {
        this.showNotification('No envelope found in clipboard', 'warning');
        return { success: false, error: 'Not an envelope' };
      }

      // Paste and submit
      return await this.pasteAndSubmit(clipboardText);

    } catch (error) {
      console.error('[AI Crosstalk] Clipboard read error:', error);
      this.showNotification('Could not read clipboard: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Paste envelope and submit
   */
  async pasteAndSubmit(envelopeText) {
    if (this.isProcessing) {
      this.showNotification('Already processing an envelope', 'warning');
      return { success: false, error: 'Already processing' };
    }

    // Validate envelope
    const validation = EnvelopeParser.validate(envelopeText);
    if (!validation.valid) {
      this.showNotification('Invalid envelope format', 'error');
      return { success: false, error: validation.errors.join(', ') };
    }

    const inputField = this.findInputField();
    if (!inputField) {
      this.showNotification('Could not find ChatGPT input field', 'error');
      return { success: false, error: 'Input field not found' };
    }

    const submitButton = this.findSubmitButton();
    if (!submitButton) {
      this.showNotification('Could not find submit button', 'error');
      return { success: false, error: 'Submit button not found' };
    }

    try {
      this.isProcessing = true;
      this.countMessages();

      // Set the input value
      if (inputField.tagName === 'TEXTAREA') {
        inputField.value = envelopeText;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // contenteditable div
        inputField.textContent = envelopeText;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Give React time to process the input
      await this.sleep(100);

      // Click submit
      submitButton.click();

      this.showNotification('Envelope sent! Waiting for response...', 'success');

      // Start watching for response
      this.watchForResponse(validation.parsed.session);

      return { success: true };
    } catch (error) {
      this.isProcessing = false;
      this.showNotification('Error pasting envelope', 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Watch for new assistant response
   */
  watchForResponse(sessionId) {
    const checkForResponse = () => {
      const currentMessageCount = this.countMessages();

      // New message appeared
      if (currentMessageCount > this.lastMessageCount) {
        const lastMessage = this.getLastAssistantMessage();

        if (lastMessage && EnvelopeParser.hasEnvelope(lastMessage)) {
          const envelope = EnvelopeParser.findLastEnvelope(lastMessage);

          if (envelope && envelope.valid && envelope.session === sessionId) {
            this.handleResponseReceived(envelope);
            return;
          }
        }

        this.lastMessageCount = currentMessageCount;
      }

      // Keep checking if still processing
      if (this.isProcessing) {
        setTimeout(checkForResponse, 500);
      }
    };

    setTimeout(checkForResponse, 1000);
  }

  /**
   * Handle received response envelope
   */
  handleResponseReceived(envelope) {
    this.isProcessing = false;

    // Try to select the envelope text for easy copying
    this.selectEnvelopeText(envelope.raw);

    this.showNotification('Response received! Press Cmd+C to copy', 'success', 3000);

    // Also notify background script
    try {
      extensionAPI.runtime.sendMessage({
        type: 'RESPONSE_RECEIVED',
        envelope: envelope
      });
    } catch (e) {
      console.log('[AI Crosstalk] Could not notify background:', e.message);
    }
  }

  /**
   * Select envelope text in the page
   */
  selectEnvelopeText(envelopeText) {
    try {
      const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
      const lastMessage = messages[messages.length - 1];

      if (lastMessage) {
        const range = document.createRange();
        range.selectNodeContents(lastMessage);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        return true;
      }
    } catch (error) {
      console.error('[AI Crosstalk] Error selecting text:', error);
    }

    return false;
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info', duration = 2000) {
    // Remove existing notification
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
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * Setup message listener for commands
   */
  setupMessageListener() {
    if (!extensionAPI || !extensionAPI.runtime) {
      console.error('[AI Crosstalk] Cannot setup message listener - extension API not available');
      return;
    }

    console.log('[AI Crosstalk] Message listener registered');

    extensionAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[AI Crosstalk] ⚡ MESSAGE RECEIVED:', message.type);

      // Test response
      if (message.type === 'PING') {
        console.log('[AI Crosstalk] PING received, sending PONG');
        sendResponse({ pong: true });
        return false;
      }

      // NEW: Handle clipboard reading directly in content script
      if (message.type === 'PASTE_FROM_CLIPBOARD') {
        console.log('[AI Crosstalk] Calling pasteFromClipboard()');
        this.pasteFromClipboard().then((result) => {
          console.log('[AI Crosstalk] pasteFromClipboard result:', result);
          sendResponse(result);
        }).catch((error) => {
          console.error('[AI Crosstalk] pasteFromClipboard error:', error);
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
      }

      // Legacy: Direct envelope paste
      if (message.type === 'PASTE_ENVELOPE') {
        console.log('[AI Crosstalk] Calling pasteAndSubmit()');
        this.pasteAndSubmit(message.envelope).then(sendResponse);
        return true; // Keep channel open for async response
      }

      if (message.type === 'GET_STATUS') {
        sendResponse({
          isProcessing: this.isProcessing,
          platform: 'chatgpt'
        });
        return false;
      }

      console.log('[AI Crosstalk] Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
    });
  }

  /**
   * Utility: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the bridge
const bridge = new ChatGPTBridge();
window.bridge = bridge; // Expose globally for debugging
console.log('[AI Crosstalk] Bridge exposed to window:', typeof window.bridge);
