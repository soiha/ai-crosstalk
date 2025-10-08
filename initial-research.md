# ChatGPT Conversation Access Research

## Key Findings

**No official API exists** for accessing ChatGPT web conversations programmatically. The main options are:

1. **Official export** (Settings → Data Controls → Export)
   - Sends ZIP with `conversations.json` file via email
   - Contains all conversation history
   - Manual process

2. **Browser extensions** (better for workflow integration)
   - **Chat Export** (open-source) - exports to Markdown, JSON, XML, HTML
   - **ChatGPT Exporter** - exports to PDF, Markdown, JSON, CSV, TXT
   - Can export individual conversations on-demand

## Recommended Approaches

### **Option 1: Manual Export Workflow (Simplest)**
- Install a browser extension like "Chat Export"
- Export relevant conversations to Markdown or JSON
- Save to a project directory (e.g., `./chatgpt-conversations/`)
- Claude Code can read them using the Read tool when needed

### **Option 2: Conversation Notes Directory (Most Flexible)**
- Create a `./context/` or `./discussions/` folder in your projects
- After important ChatGPT discussions, export and save them there
- Optionally add a summary/index file listing what each contains
- Claude Code can reference these whenever you mention them or when working on related features

### **Option 3: Hybrid Memory System (Most Robust)**
- Combine browser extension exports with manual notes
- Create standardized format: `YYYY-MM-DD-topic.md`
- Include both raw conversations and your summaries/decisions
- Could even build a simple CLI tool to help organize them

## Browser Extensions Found

- **Chat Export** - Open-source, supports ChatGPT and Claude, exports to Markdown/XML/JSON/HTML
  - Available for Chrome and Firefox
  - GitHub: Trifall/chat-export

- **ChatGPT Exporter** - Exports to PDF, Markdown, JSON, CSV, TXT, Images
  - Chrome Web Store extension
  - Works on Edge, Brave, other Chromium browsers

- **Browser scripts** (no extension needed) - Can run from browser console for local-only processing

## Implementation Notes

- Official data export returns `conversations.json` with all chat history
- JSON structure is not well-documented by OpenAI
- Browser extensions provide more flexible, on-demand export options
- No data leaves your machine with local browser scripts
