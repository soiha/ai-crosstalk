/**
 * Background Service Worker
 * Coordinates between tabs and handles keyboard shortcuts
 */

// Store active AI tabs
const activeTabs = {
  chatgpt: null,
  claude: null
};

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'paste-envelope') {
    await handlePasteEnvelope();
  } else if (command === 'copy-envelope') {
    await handleCopyEnvelope();
  }
});

/**
 * Handle paste envelope command (Cmd+Shift+E)
 */
async function handlePasteEnvelope() {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) {
      console.error('[AI Crosstalk] No active tab');
      return;
    }

    // Check if it's a supported AI platform
    const platform = detectPlatform(activeTab.url);

    if (!platform) {
      showNotification('This command only works on ChatGPT or Claude.ai tabs');
      return;
    }

    // Read clipboard
    const clipboardText = await readClipboard();

    if (!clipboardText) {
      showNotification('No text found in clipboard');
      return;
    }

    // Check if clipboard contains an envelope
    if (!clipboardText.includes('[[') || !clipboardText.includes('[[END]]')) {
      showNotification('Clipboard does not contain an envelope');
      return;
    }

    // Send to content script
    chrome.tabs.sendMessage(activeTab.id, {
      type: 'PASTE_ENVELOPE',
      envelope: clipboardText
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AI Crosstalk] Error:', chrome.runtime.lastError);
        showNotification('Error: Could not communicate with page. Try refreshing.');
      } else if (!response?.success) {
        showNotification(`Error: ${response?.error || 'Unknown error'}`);
      }
    });

  } catch (error) {
    console.error('[AI Crosstalk] Error in paste:', error);
    showNotification('Error pasting envelope');
  }
}

/**
 * Handle copy envelope command (Cmd+Shift+C)
 */
async function handleCopyEnvelope() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) {
      console.error('[AI Crosstalk] No active tab');
      return;
    }

    const platform = detectPlatform(activeTab.url);

    if (!platform) {
      showNotification('This command only works on ChatGPT or Claude.ai tabs');
      return;
    }

    // Send to content script
    chrome.tabs.sendMessage(activeTab.id, {
      type: 'COPY_ENVELOPE'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AI Crosstalk] Error:', chrome.runtime.lastError);
        showNotification('Error: Could not communicate with page. Try refreshing.');
      } else if (!response?.success) {
        showNotification(`Error: ${response?.error || 'Unknown error'}`);
      }
    });

  } catch (error) {
    console.error('[AI Crosstalk] Error in copy:', error);
    showNotification('Error copying envelope');
  }
}

/**
 * Read text from clipboard
 * Note: This requires clipboardRead permission and user interaction
 */
async function readClipboard() {
  try {
    // For background scripts, we need to read from active tab's clipboard
    // This is a workaround for clipboard API limitations in service workers
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) return null;

    // Inject a script to read clipboard
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (error) {
          console.error('Clipboard read error:', error);
          return null;
        }
      }
    });

    return result[0]?.result;
  } catch (error) {
    console.error('[AI Crosstalk] Clipboard read error:', error);
    return null;
  }
}

/**
 * Detect which AI platform the URL belongs to
 */
function detectPlatform(url) {
  if (!url) return null;

  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (url.includes('claude.ai')) {
    return 'claude';
  } else if (url.includes('gemini.google.com')) {
    return 'gemini';
  }

  return null;
}

/**
 * Show notification using browser's notification API
 */
function showNotification(message, title = 'AI Crosstalk') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon-128.png',
    title: title,
    message: message,
    priority: 1
  });
}

/**
 * Track active AI tabs
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const platform = detectPlatform(tab.url);

    if (platform) {
      activeTabs[platform] = tabId;
      console.log(`[AI Crosstalk] Detected ${platform} tab: ${tabId}`);
    }
  }
});

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RESPONSE_RECEIVED') {
    console.log('[AI Crosstalk] Response received:', message.envelope);
    showNotification('AI response received! Ready to copy.', 'AI Crosstalk');
  }

  if (message.type === 'ENVELOPE_COPIED') {
    console.log('[AI Crosstalk] Envelope copied:', message.envelope);
  }

  sendResponse({ received: true });
});

console.log('[AI Crosstalk] Background service worker loaded');
