/**
 * Background Service Worker - Safari Compatible v2
 * Coordinates between tabs and handles keyboard shortcuts
 */

// Store active AI tabs
const activeTabs = {
  chatgpt: null,
  claude: null
};

// Listen for keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[AI Crosstalk] Command received:', command);

  if (command === 'paste-envelope') {
    await handlePasteEnvelope();
  } else if (command === 'copy-envelope') {
    await handleCopyEnvelope();
  }
});

/**
 * Handle paste envelope command (Cmd+Shift+V)
 */
async function handlePasteEnvelope() {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) {
      console.error('[AI Crosstalk] No active tab');
      return;
    }

    const platform = detectPlatform(activeTab.url);

    if (!platform) {
      console.log('[AI Crosstalk] Not on a supported platform:', activeTab.url);
      return;
    }

    console.log('[AI Crosstalk] Sending PASTE_FROM_CLIPBOARD to content script on tab', activeTab.id);

    // Content script will read clipboard itself (has user gesture context)
    chrome.tabs.sendMessage(activeTab.id, {
      type: 'PASTE_FROM_CLIPBOARD'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AI Crosstalk] Error:', chrome.runtime.lastError.message);
      } else {
        console.log('[AI Crosstalk] Content script response:', response);
      }
    });

  } catch (error) {
    console.error('[AI Crosstalk] Error in handlePasteEnvelope:', error);
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
      console.log('[AI Crosstalk] Not on a supported platform');
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, {
      type: 'COPY_ENVELOPE'
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AI Crosstalk] Error:', chrome.runtime.lastError.message);
      } else {
        console.log('[AI Crosstalk] Content script response:', response);
      }
    });

  } catch (error) {
    console.error('[AI Crosstalk] Error in handleCopyEnvelope:', error);
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
  console.log('[AI Crosstalk] Message from content script:', message.type);

  if (message.type === 'RESPONSE_RECEIVED') {
    console.log('[AI Crosstalk] Response received:', message.envelope);
  }

  if (message.type === 'ENVELOPE_COPIED') {
    console.log('[AI Crosstalk] Envelope copied:', message.envelope);
  }

  sendResponse({ received: true });
  return false;
});

console.log('[AI Crosstalk] Background service worker loaded');
