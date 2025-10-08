# AI Crosstalk Bridge - Safari Extension

A Safari extension that streamlines AI Crosstalk envelope exchange between Claude and ChatGPT using keyboard shortcuts.

## Features

- **⌨️ Keyboard Shortcuts** - Cmd+Shift+E to paste & send, Cmd+Shift+C to copy
- **🎯 Auto-detection** - Automatically detects ChatGPT and Claude.ai tabs
- **📋 Clipboard Integration** - Seamless clipboard reading and writing
- **🔔 Smart Notifications** - Visual feedback for all actions
- **✨ Auto-selection** - Automatically selects response envelopes for easy copying

## Workflow

The extension implements **Option B** (semi-automatic with hotkeys):

1. **Generate envelope in Claude** → Auto-copied to clipboard ✓
2. **Switch to ChatGPT tab** → Press `Cmd+Shift+E`
3. **Extension pastes and submits** → Watches for response
4. **Response received** → Auto-selects envelope text
5. **Press `Cmd+C`** → Switches back to Claude
6. **Paste response** → Continue conversation

**Saves: 3-4 manual steps per exchange!**

## Installation

### Prerequisites

- macOS 11.0 or later
- Safari 14.0 or later
- Xcode (for building the extension)

### Build & Install

1. **Clone the repository**
   ```bash
   cd ai-crosstalk/extensions/safari
   ```

2. **Add extension icons** (required)

   Create PNG icons in the `icons/` directory:
   - `icon-16.png` (16×16)
   - `icon-32.png` (32×32)
   - `icon-48.png` (48×48)
   - `icon-128.png` (128×128)

   Or generate them quickly:
   ```bash
   # Using ImageMagick
   convert -size 128x128 xc:none -fill "#667eea" -draw "circle 64,64 64,10" icons/icon-128.png
   convert icons/icon-128.png -resize 48x48 icons/icon-48.png
   convert icons/icon-128.png -resize 32x32 icons/icon-32.png
   convert icons/icon-128.png -resize 16x16 icons/icon-16.png
   ```

3. **Create Safari App Extension (via Xcode)**

   Safari extensions require an Xcode wrapper. Create one:

   a. Open Xcode → File → New → Project
   b. Choose "Safari Extension App"
   c. Name it "AI Crosstalk Bridge"
   d. Set the bundle identifier (e.g., `com.yourname.ai-crosstalk`)
   e. In the extension target, replace the generated files with the contents of this directory

   **OR** use the command-line tool:

   ```bash
   # This will be added in a future update
   # For now, manual Xcode setup is required
   ```

4. **Enable in Safari**

   a. Open Safari → Preferences → Extensions
   b. Enable "AI Crosstalk Bridge"
   c. Grant clipboard permissions when prompted

## Usage

### Keyboard Shortcuts

| Shortcut | Action | When to Use |
|----------|--------|-------------|
| `Cmd+Shift+E` | Paste & Send Envelope | On ChatGPT tab with envelope in clipboard |
| `Cmd+Shift+C` | Copy Envelope | On Claude tab after receiving response |

### Step-by-Step

1. **In Claude Code or Claude.ai:**
   - Generate an envelope (it's auto-copied)

2. **Switch to ChatGPT tab:**
   - Press `Cmd+Shift+E`
   - Extension pastes, submits, and watches for response
   - Notification appears: "Envelope sent! Waiting for response..."

3. **When response arrives:**
   - Extension auto-selects the envelope
   - Notification: "Response received! Press Cmd+C to copy"
   - Press `Cmd+C`

4. **Switch back to Claude:**
   - Press `Cmd+V` to paste the response

5. **Continue the conversation!**

### Manual Triggering (Popup)

Click the extension icon in Safari toolbar for manual controls:
- **Paste Envelope** button
- **Copy Envelope** button
- Status indicator showing current platform

## Supported Platforms

- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude.ai (claude.ai)
- 🚧 Gemini (coming soon)

## Permissions

The extension requires:

- **clipboardRead** - To read envelopes from clipboard
- **clipboardWrite** - To copy response envelopes
- **activeTab** - To interact with the current tab
- **storage** - To save preferences (future use)
- **Host permissions** - For ChatGPT, Claude, and Gemini domains

All permissions are used exclusively for envelope exchange. No data is collected or transmitted.

## Troubleshooting

### Extension doesn't respond to keyboard shortcuts

1. Refresh the AI platform tab
2. Check Safari → Preferences → Extensions → AI Crosstalk Bridge is enabled
3. Ensure clipboard permissions are granted

### "Could not find input field" error

ChatGPT's DOM structure changes frequently. If this happens:

1. Refresh the page
2. Check for ChatGPT UI updates
3. Report the issue with browser console logs

### Clipboard access denied

Safari requires explicit permission for clipboard access:

1. Safari → Preferences → Websites → Other
2. Find "AI Crosstalk Bridge"
3. Set clipboard access to "Allow"

## Development

### File Structure

```
safari/
├── manifest.json           # Extension configuration
├── scripts/
│   ├── envelope-parser.js  # Envelope parsing utilities
│   ├── content-chatgpt.js  # ChatGPT page integration
│   ├── content-claude.js   # Claude page integration
│   └── background.js       # Background service worker
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── icons/                 # Extension icons
```

### Testing

1. Load the unpacked extension in Safari Developer mode
2. Open ChatGPT in one tab, Claude in another
3. Test keyboard shortcuts with sample envelopes
4. Check browser console for errors

### Contributing

Improvements welcome!

**Ideas:**
- Auto-detect when ChatGPT finishes typing (current implementation polls)
- Support for Gemini and other AI platforms
- Session history tracking
- Batch envelope exchange
- Custom keyboard shortcuts

## Known Limitations

- **Safari-only** - Web Extensions manifest v3 support varies by browser
- **Requires Xcode** - Safari extensions need native app wrapper
- **DOM brittleness** - ChatGPT/Claude UI changes may break selectors
- **Clipboard timing** - Safari's clipboard API has security restrictions

## Future Enhancements

- [ ] Native macOS app for full clipboard monitoring
- [ ] Chrome/Firefox versions
- [ ] Configurable keyboard shortcuts
- [ ] Multi-turn conversation threading
- [ ] Envelope history viewer
- [ ] Auto-update DOM selectors via remote config

## License

MIT License - see [../../LICENSE](../../LICENSE) for details.

---

**Part of the [AI Crosstalk](https://github.com/soiha/ai-crosstalk) project**
