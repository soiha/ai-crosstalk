# Safari Extension Setup Guide

Step-by-step instructions for building and enabling the AI Crosstalk Safari extension.

## Prerequisites

- macOS 11.0+
- Xcode 12.0+
- Safari 14.0+
- Apple Developer account (free tier is fine)

## Step 1: Enable Safari Developer Mode

1. Open **Safari**
2. Go to **Safari** → **Preferences** (or **Settings** on macOS Ventura+)
3. Click **Advanced** tab
4. ✅ Check **"Show Develop menu in menu bar"**
5. Close preferences

## Step 2: Create Xcode Project

### Option A: Using Xcode GUI (Recommended for first-timers)

1. Open **Xcode**
2. **File** → **New** → **Project**
3. Choose **macOS** tab
4. Select **Safari Extension App**
5. Click **Next**
6. Configure project:
   - **Product Name**: `AI Crosstalk Bridge`
   - **Team**: Select your Apple ID (or "None" for local testing)
   - **Organization Identifier**: `com.yourname` or similar
   - **Bundle Identifier**: Auto-generated (e.g., `com.yourname.AI-Crosstalk-Bridge`)
   - **Language**: Swift
   - **User Interface**: SwiftUI
7. Click **Next**
8. Save location: `ai-crosstalk/extensions/safari-xcode/`
9. Click **Create**

### Option B: Using xcrun (Command-line)

```bash
cd extensions/safari

# Create Xcode project from template
xcrun safari-web-extension-converter \
  --app-name "AI Crosstalk Bridge" \
  --bundle-identifier "com.yourname.ai-crosstalk-bridge" \
  --swift \
  .

# This creates an Xcode project in the current directory
```

## Step 3: Configure Extension in Xcode

1. In Xcode, expand the project navigator (left sidebar)
2. Find the **Extension** target (should have a blue puzzle piece icon)
3. **Replace** the generated files with our files:

   **Delete these from Extension folder:**
   - `Resources/` folder (contains template scripts)
   - Any `.js` files in Extension folder

   **Add our files:**
   - Drag `scripts/` folder → Extension target
   - Drag `popup/` folder → Extension target
   - Drag `icons/` folder → Extension target (if icons exist)
   - Drag `manifest.json` → Extension target

4. **Verify manifest.json is in the Extension target:**
   - Click `manifest.json`
   - In right panel, ensure Extension target is checked

5. **Update Info.plist** (if needed):
   - Extension → Info.plist
   - Verify `NSExtension` → `NSExtensionPointIdentifier` is `com.apple.Safari.web-extension`

## Step 4: Build and Run

1. Select the **AI Crosstalk Bridge** scheme (top toolbar, next to Run button)
2. Select **"My Mac"** as the destination
3. Click **Run** (▶️ button) or press `Cmd+R`
4. Xcode will build and launch the app

**Expected result:** A small app window opens (this is just a container for the extension)

## Step 5: Enable Extension in Safari

### First Time Setup

1. Safari should prompt: **"AI Crosstalk Bridge" would like to use Safari Extension**
   - Click **Open Safari Extensions Preferences**

   **OR** manually open:
   - Safari → **Preferences/Settings**
   - Click **Extensions** tab

2. In Extensions list, find **AI Crosstalk Bridge**
   - ✅ Check the box to enable it
   - Click **Turn On**

3. **Grant Permissions:**
   - Click **AI Crosstalk Bridge** in left sidebar
   - **Website Access:** Choose one:
     - ✅ **Allow for these websites** (more secure)
       - Add: `chatgpt.com`, `chat.openai.com`, `claude.ai`
     - ✅ **Always Allow on Every Website** (easier for testing)

4. **Grant Clipboard Permissions:**
   - Safari → **Preferences/Settings** → **Websites**
   - Scroll to **Other** section
   - Find **AI Crosstalk Bridge**
   - Set clipboard access to **Allow**

### If Extension Doesn't Appear

**Solution 1: Rebuild and Restart**
```bash
# In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
# Then rebuild: Cmd+R
# Quit Safari completely
# Re-run from Xcode
```

**Solution 2: Check Developer Mode**
1. Safari → **Develop** menu (should be visible)
2. **Allow Unsigned Extensions** (for local testing)
3. Restart Safari

**Solution 3: Check Target Membership**
- In Xcode, select `manifest.json`
- File Inspector (right panel) → **Target Membership**
- ✅ Ensure Extension target is checked

**Solution 4: Reset Safari Extensions**
```bash
# Quit Safari
# Remove extension cache
rm -rf ~/Library/Safari/Extensions/*

# Restart Safari
# Re-run Xcode project
```

## Step 6: Test the Extension

1. **Open ChatGPT** in Safari: https://chatgpt.com
2. **Check extension icon** in Safari toolbar (should appear)
3. **Click extension icon** → Popup should show "✅ ChatGPT detected"

### Test Keyboard Shortcuts

1. **Copy test envelope to clipboard:**
   ```
   [[TEST→CHATGPT v1]]
   user: tester
   session: 2025-10-09T10:00Z abc123
   context: test
   intent: QUESTION
   body: |
     This is a test envelope.
   sig: none
   [[END]]
   ```

2. **On ChatGPT tab, press:** `Cmd+Shift+E`
3. **Expected:** Envelope pastes into input and submits
4. **Check console:** Right-click page → Inspect → Console
   - Should see: `[AI Crosstalk] ChatGPT bridge initialized`

### Troubleshooting Test

**"Could not find input field" error:**
- ChatGPT's DOM changed
- Open Console (Inspect Element)
- Look for error messages
- Check that selectors in `content-chatgpt.js` still work

**Keyboard shortcut doesn't work:**
- Check Safari → Preferences → Extensions → AI Crosstalk Bridge → Permissions
- Ensure website access is granted
- Try refreshing the ChatGPT tab
- Check Develop → Show JavaScript Console for errors

**"Clipboard access denied":**
- Safari → Preferences → Websites → Other
- Find AI Crosstalk Bridge
- Set to **Allow**

## Step 7: Daily Development Workflow

Once set up, you only need to:

1. Make changes to `.js` files
2. In Xcode: `Cmd+R` (run)
3. Safari will reload the extension
4. Refresh AI platform tabs

**Pro tip:** Enable auto-reload in Safari:
- Develop → Web Extension Background Content → [Your Extension]
- This shows console for background script

## Common Issues & Solutions

### Issue: Extension icon doesn't appear in toolbar

**Solution:**
1. Right-click Safari toolbar
2. **Customize Toolbar...**
3. Drag **Extensions** button to toolbar
4. Click **Extensions** → Enable AI Crosstalk Bridge

### Issue: "This extension is not signed by a verified developer"

**Solution:**
1. Safari → **Develop** → **Allow Unsigned Extensions**
2. OR sign with paid Apple Developer account

### Issue: Changes to code not reflecting

**Solution:**
```bash
# In Xcode
Product → Clean Build Folder (Cmd+Shift+K)
Product → Build (Cmd+B)

# In Safari
Develop → Empty Caches
Reload page
```

### Issue: Clipboard permissions keep resetting

**Solution:**
This is a Safari security feature. Set to **Always Allow**:
1. Safari → Preferences → Websites
2. Scroll to **Other**
3. AI Crosstalk Bridge → **Always Allow**

## Verifying Everything Works

### Checklist

- [ ] Extension appears in Safari → Preferences → Extensions
- [ ] Extension is enabled (checkbox checked)
- [ ] Website access granted for chatgpt.com, claude.ai
- [ ] Clipboard access set to "Allow"
- [ ] Extension icon visible in Safari toolbar
- [ ] Popup opens when clicking icon
- [ ] ChatGPT tab shows "✅ ChatGPT detected" in popup
- [ ] Cmd+Shift+E pastes test envelope
- [ ] Console shows no errors

### Console Debugging

**Check Background Script:**
1. Safari → Develop → Web Extension Background Content → AI Crosstalk Bridge
2. Should see: `[AI Crosstalk] Background service worker loaded`

**Check Content Script:**
1. On ChatGPT tab: Right-click → Inspect Element → Console
2. Should see: `[AI Crosstalk] ChatGPT bridge initialized`

## Getting Help

If you're still stuck:

1. **Check Xcode console** for build errors
2. **Check Safari console** (Develop → Show JavaScript Console)
3. **Check System Preferences** → Security & Privacy → App Management
   - Ensure Safari can run extensions
4. **Try the template extension first** to verify Safari extension workflow
5. **Share error messages** from consoles when reporting issues

## Next Steps

Once working:
- Test with real AI conversations
- Try both ChatGPT and Claude platforms
- Report any DOM selector issues (UIs change frequently)
- Consider creating app icons for better visual appeal

---

**Note:** Safari extensions require more setup than Chrome/Firefox due to Apple's security model. This is normal!
