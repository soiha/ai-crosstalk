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
    this.setupKeyboardShortcuts();
    this.countMessages();
  }

  /**
   * Setup keyboard shortcuts (Safari workaround for clipboard access)
   */
  setupKeyboardShortcuts() {
    const handler = async (event) => {
      // Debug ALL keydown events with modifiers
      if (event.metaKey || event.ctrlKey) {
        console.log('[AI Crosstalk] Key pressed:', {
          key: event.key,
          code: event.code,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey
        });
      }

      // Cmd+Shift+E (or Ctrl+Shift+E on non-Mac) - for "Envelope" paste
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'E' || event.code === 'KeyE')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[AI Crosstalk] ⌨️ PASTE SHORTCUT TRIGGERED');
        await this.pasteFromClipboard();
      }

      // Cmd+Shift+R (or Ctrl+Shift+R on non-Mac) - for "Retrieve" response
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === 'R' || event.code === 'KeyR')) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[AI Crosstalk] ⌨️ COPY SHORTCUT TRIGGERED');
        await this.copyLastEnvelope();
      }
    };

    document.addEventListener('keydown', handler, true); // Use capture phase
    console.log('[AI Crosstalk] Keyboard shortcuts registered (capture mode)');
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
      'button[data-testid="fruitjuice-send-button"]',
      'button[aria-label*="Send"]',
      'form button[type="submit"]',
      'button:has(svg)',
      'button svg[class*="send"]'
    ];

    console.log('[AI Crosstalk] Searching for submit button...');

    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          console.log('[AI Crosstalk] Found button with selector:', selector, element);
          if (!element.disabled) {
            console.log('[AI Crosstalk] Button is enabled, using it');
            return element;
          } else {
            console.log('[AI Crosstalk] Button is disabled, trying next selector');
          }
        }
      } catch (e) {
        // Invalid selector, skip
        console.log('[AI Crosstalk] Selector failed:', selector, e.message);
      }
    }

    console.error('[AI Crosstalk] No submit button found with any selector');
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
   * Safari workaround: Use prompt() to let user paste manually
   */
  async pasteFromClipboard() {
    try {
      let clipboardText = null;

      // Try modern Clipboard API first
      try {
        clipboardText = await navigator.clipboard.readText();
        console.log('[AI Crosstalk] Clipboard API worked!');
      } catch (clipboardError) {
        console.log('[AI Crosstalk] Clipboard API blocked, using prompt fallback');

        // Safari workaround: Show a prompt where user can paste manually
        clipboardText = prompt(
          '🤖 AI Crosstalk\n\n' +
          'Safari blocks automatic clipboard access.\n' +
          'Please paste (Cmd+V) the envelope here:',
          ''
        );

        if (!clipboardText) {
          this.showNotification('Paste cancelled', 'warning');
          return { success: false, error: 'User cancelled' };
        }

        console.log('[AI Crosstalk] Got text from prompt - length:', clipboardText.length);
      }

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
      console.log('[AI Crosstalk] Calling pasteAndSubmit...');
      const result = await this.pasteAndSubmit(clipboardText);
      console.log('[AI Crosstalk] pasteAndSubmit result:', result);
      return result;

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
      console.log('[AI Crosstalk] Setting input field value...');
      if (inputField.tagName === 'TEXTAREA') {
        inputField.value = envelopeText;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // contenteditable div
        inputField.textContent = envelopeText;
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Give React time to process the input and enable the button
      console.log('[AI Crosstalk] Waiting for React to process input...');
      await this.sleep(500);

      // Check if button is still enabled
      if (submitButton.disabled) {
        console.error('[AI Crosstalk] Submit button became disabled after setting input');
        this.showNotification('Submit button is disabled', 'error');
        this.isProcessing = false;
        return { success: false, error: 'Submit button disabled' };
      }

      // Click submit
      console.log('[AI Crosstalk] Clicking submit button...');
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
   * Copy the last envelope from the conversation
   */
  async copyLastEnvelope() {
    try {
      console.log('[AI Crosstalk] Looking for last envelope...');
      const lastMessage = this.getLastAssistantMessage();

      if (!lastMessage) {
        this.showNotification('No assistant message found', 'warning');
        return { success: false, error: 'No message' };
      }

      console.log('[AI Crosstalk] Last message text:', lastMessage.substring(0, 200));

      if (!EnvelopeParser.hasEnvelope(lastMessage)) {
        this.showNotification('Last message has no envelope', 'warning');
        return { success: false, error: 'No envelope in message' };
      }

      const envelope = EnvelopeParser.findLastEnvelope(lastMessage);

      console.log('[AI Crosstalk] Parsed envelope:', envelope);

      if (!envelope || !envelope.valid) {
        this.showNotification('Invalid envelope found', 'error');
        console.error('[AI Crosstalk] Invalid envelope:', envelope);
        return { success: false, error: 'Invalid envelope' };
      }

      console.log('[AI Crosstalk] Found envelope:', envelope.raw.substring(0, 100) + '...');

      // Try to copy to clipboard
      try {
        await navigator.clipboard.writeText(envelope.raw);
        this.showNotification('Envelope copied to clipboard!', 'success');
        console.log('[AI Crosstalk] Copied to clipboard successfully');
        return { success: true };
      } catch (clipboardError) {
        console.log('[AI Crosstalk] Clipboard write blocked, showing in prompt');

        // Safari fallback: Show in a dialog where user can copy manually
        prompt(
          '🤖 AI Crosstalk - Copy Response\n\n' +
          'Safari blocks automatic clipboard write.\n' +
          'Copy this envelope (Cmd+C):',
          envelope.raw
        );

        this.showNotification('Please copy from the dialog', 'info');
        return { success: true };
      }

    } catch (error) {
      console.error('[AI Crosstalk] Copy error:', error);
      this.showNotification('Error copying envelope', 'error');
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

    // Safari note: tabs.sendMessage() triggers runtime.onMessage in content scripts
    // This is the ONLY listener needed for both background and popup messages
    const messageHandler = (message, sender, sendResponse) => {
      console.log('[AI Crosstalk] ⚡ MESSAGE RECEIVED:', message.type);
      console.log('[AI Crosstalk] Sender:', sender);

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
    };

    // Register on runtime.onMessage - this receives tabs.sendMessage() in Safari
    extensionAPI.runtime.onMessage.addListener(messageHandler);
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
