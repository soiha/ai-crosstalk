/**
 * Popup UI Controller
 */

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
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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

      setStatus(`✅ ${platformNames[platform]} detected`, 'active');
      enableButtons();
    } else {
      setStatus('⚠️ Not on a supported AI platform', 'inactive');
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
async function handlePasteClick() {
  if (!currentTab) return;

  try {
    // Read clipboard
    const clipboardText = await navigator.clipboard.readText();

    if (!clipboardText) {
      showMessage('No text in clipboard', 'error');
      return;
    }

    if (!clipboardText.includes('[[') || !clipboardText.includes('[[END]]')) {
      showMessage('Clipboard does not contain an envelope', 'error');
      return;
    }

    // Send to content script
    chrome.tabs.sendMessage(currentTab.id, {
      type: 'PASTE_ENVELOPE',
      envelope: clipboardText
    }, (response) => {
      if (chrome.runtime.lastError) {
        showMessage('Error: Try refreshing the page', 'error');
      } else if (response?.success) {
        showMessage('Envelope pasted successfully!', 'success');
        setTimeout(() => window.close(), 1000);
      } else {
        showMessage(`Error: ${response?.error || 'Unknown error'}`, 'error');
      }
    });

  } catch (error) {
    console.error('Paste error:', error);
    showMessage('Error pasting envelope', 'error');
  }
}

/**
 * Handle copy button click
 */
async function handleCopyClick() {
  if (!currentTab) return;

  try {
    chrome.tabs.sendMessage(currentTab.id, {
      type: 'COPY_ENVELOPE'
    }, (response) => {
      if (chrome.runtime.lastError) {
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
