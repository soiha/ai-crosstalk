/**
 * Popup UI Controller
 */

// Safari compatibility: MUST use browser API to match content script
// Safari has both, but they don't communicate across APIs
const extensionAPI = (typeof browser !== 'undefined') ? browser : chrome;

console.log('[Popup] browser available:', typeof browser);
console.log('[Popup] chrome available:', typeof chrome);
console.log('[Popup] Using API:', extensionAPI === browser ? 'browser' : extensionAPI === chrome ? 'chrome' : 'none');

if (!extensionAPI) {
  console.error('[Popup] Extension API not available');
}

let currentTab = null;
let currentPlatform = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await updateTabStatus();
  setupEventListeners();
});

/**
 * Update tab status display
 */
async function updateTabStatus() {
  try {
    const [tab] = await extensionAPI.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      setStatus('No active tab', 'inactive');
      return;
    }

    currentTab = tab;
    const platform = detectPlatform(tab.url);
    currentPlatform = platform;

    if (platform) {
      const platformNames = {
        chatgpt: 'ChatGPT',
        claude: 'Claude',
        gemini: 'Gemini'
      };

      const apiName = extensionAPI === browser ? 'browser' : extensionAPI === chrome ? 'chrome' : 'none';
      setStatus(`✅ ${platformNames[platform]} detected`, 'active');
      setDebugInfo(`Tab: ${tab.id} | API: ${apiName} | ${tab.url.substring(0, 20)}...`);
      enableButtons();
    } else {
      setStatus('⚠️ Not on a supported AI platform', 'inactive');
      setDebugInfo(`Tab ID: ${tab.id} | Not supported`);
      disableButtons();
    }
  } catch (error) {
    console.error('Error updating status:', error);
    setStatus('Error detecting tab', 'inactive');
  }
}

/**
 * Set status display
 */
function setStatus(text, state) {
  const statusElement = document.getElementById('tab-status');
  const infoElement = document.getElementById('tab-info');

  infoElement.textContent = text;

  statusElement.classList.remove('active', 'inactive');
  if (state) {
    statusElement.classList.add(state);
  }
}

/**
 * Enable action buttons
 */
function enableButtons() {
  const btnPaste = document.getElementById('btn-paste');
  const btnCopy = document.getElementById('btn-copy');

  if (currentPlatform === 'chatgpt') {
    btnPaste.disabled = false;
    btnCopy.disabled = true; // ChatGPT auto-detects response
  } else if (currentPlatform === 'claude') {
    btnPaste.disabled = true;
    btnCopy.disabled = false;
  } else {
    btnPaste.disabled = false;
    btnCopy.disabled = false;
  }
}

/**
 * Disable action buttons
 */
function disableButtons() {
  document.getElementById('btn-paste').disabled = true;
  document.getElementById('btn-copy').disabled = true;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  document.getElementById('btn-paste').addEventListener('click', handlePasteClick);
  document.getElementById('btn-copy').addEventListener('click', handleCopyClick);
}

/**
 * Handle paste button click
 */
function setDebugInfo(msg) {
  const debug = document.getElementById('debug-info');
  if (debug) debug.textContent = msg;
}

async function handlePasteClick() {
  if (!currentTab) {
    setDebugInfo('ERROR: No current tab');
    return;
  }

  setDebugInfo(`Reading clipboard...`);

  try {
    // Step 1: Read clipboard in popup context (has permissions)
    console.log('[Popup] Reading clipboard...');
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText) {
      showMessage('Clipboard is empty', 'error');
      return;
    }

    console.log('[Popup] Clipboard text length:', clipboardText.length);
    setDebugInfo(`Clipboard: ${clipboardText.length} chars`);

    // Step 2: Check if it's an envelope
    if (!clipboardText.includes('[[') || !clipboardText.includes('[[END]]')) {
      showMessage('No envelope found in clipboard', 'error');
      return;
    }

    setDebugInfo(`Sending envelope to tab ${currentTab.id}...`);

    // Step 3: Pass the envelope text to the content script via executeScript
    const pasteResults = await extensionAPI.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: (envelopeText) => {
        // This runs in the page context with the envelope as argument
        if (window.bridge && typeof window.bridge.pasteAndSubmit === 'function') {
          return window.bridge.pasteAndSubmit(envelopeText);
        }
        return { success: false, error: 'Bridge not found' };
      },
      args: [clipboardText]
    });

    console.log('[Popup] Paste result:', pasteResults);
    const result = pasteResults[0]?.result;

    if (result?.success) {
      showMessage('Envelope pasted successfully!', 'success');
      setTimeout(() => window.close(), 1000);
    } else {
      const errorMsg = result?.error || 'Unknown error';
      showMessage(`Error: ${errorMsg}`, 'error');
      setDebugInfo(`ERROR: ${errorMsg}`);
      console.error('[Popup] Content script error:', errorMsg);
    }

  } catch (error) {
    console.error('Paste error:', error);
    setDebugInfo(`EXCEPTION: ${error.message}`);
    showMessage('Error pasting envelope', 'error');
  }
}

/**
 * Handle copy button click
 */
async function handleCopyClick() {
  if (!currentTab) return;

  try {
    const response = await extensionAPI.tabs.sendMessage(currentTab.id, {
      type: 'COPY_ENVELOPE'
    });

    if (response?.success) {
      showMessage('Envelope copied!', 'success');
      setTimeout(() => window.close(), 1000);
    } else {
      showMessage(`Error: ${response?.error || 'Unknown error'}`, 'error');
    }

  } catch (error) {
    console.error('Copy error:', error);
    showMessage('Error copying envelope', 'error');
  }
}

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
  const statusElement = document.getElementById('tab-status');
  const infoElement = document.getElementById('tab-info');

  const originalText = infoElement.textContent;
  const originalClass = statusElement.className;

  infoElement.textContent = text;
  statusElement.classList.remove('active', 'inactive');

  if (type === 'success') {
    statusElement.classList.add('active');
  } else if (type === 'error') {
    statusElement.classList.add('inactive');
  }

  setTimeout(() => {
    infoElement.textContent = originalText;
    statusElement.className = originalClass;
  }, 2000);
}

/**
 * Detect platform from URL
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
