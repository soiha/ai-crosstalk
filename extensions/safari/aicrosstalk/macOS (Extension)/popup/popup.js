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

  setDebugInfo(`Sending to tab ${currentTab.id}...`);

  try {
    // First test if content script is responding at all
    console.log('[Popup] Testing connection with PING to tab', currentTab.id);
    console.log('[Popup] extensionAPI.tabs:', extensionAPI.tabs);
    console.log('[Popup] extensionAPI.tabs.sendMessage:', typeof extensionAPI.tabs.sendMessage);
    setDebugInfo(`PING to tab ${currentTab.id}...`);

    const msgResult = extensionAPI.tabs.sendMessage(currentTab.id, { type: 'PING' }, (pingResponse) => {
      console.log('[Popup] ===== CALLBACK INVOKED =====');
      console.log('[Popup] PING response:', pingResponse);
      console.log('[Popup] lastError:', extensionAPI.runtime.lastError);
      setDebugInfo(`PING response: ${JSON.stringify(pingResponse)}`);

      if (extensionAPI.runtime.lastError) {
        console.error('[Popup] PING failed:', extensionAPI.runtime.lastError);
        setDebugInfo(`PING ERROR: ${extensionAPI.runtime.lastError.message}`);
        showMessage('Content script not responding. Refresh page?', 'error');
        return;
      }

      // If PING works, send the actual message
      console.log('[Popup] Sending PASTE_FROM_CLIPBOARD to tab', currentTab.id);
      extensionAPI.tabs.sendMessage(currentTab.id, {
        type: 'PASTE_FROM_CLIPBOARD'
      }, (response) => {
        console.log('[Popup] Response:', response);
        console.log('[Popup] Runtime error:', extensionAPI.runtime.lastError);

        if (extensionAPI.runtime.lastError) {
          showMessage('Error: Try refreshing the page', 'error');
          console.error('[Popup] Runtime error:', extensionAPI.runtime.lastError);
        } else if (response?.success) {
          showMessage('Envelope pasted successfully!', 'success');
          setTimeout(() => window.close(), 1000);
        } else {
          const errorMsg = response?.error || 'Unknown error';
          showMessage(`Error: ${errorMsg}`, 'error');
          console.error('[Popup] Content script error:', errorMsg);
        }
      });
    });

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
    extensionAPI.tabs.sendMessage(currentTab.id, {
      type: 'COPY_ENVELOPE'
    }, (response) => {
      if (extensionAPI.runtime.lastError) {
        showMessage('Error: Try refreshing the page', 'error');
      } else if (response?.success) {
        showMessage('Envelope copied!', 'success');
        setTimeout(() => window.close(), 1000);
      } else {
        showMessage(`Error: ${response?.error || 'Unknown error'}`, 'error');
      }
    });

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
