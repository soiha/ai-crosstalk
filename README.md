# AI Crosstalk

**Enable structured communication between any two AI assistants.**

AI Crosstalk is a simple, extensible protocol that lets two AI assistants (Claude, ChatGPT, Gemini, etc.) communicate with each other through a human intermediary. Perfect for AI pair programming, collaborative problem-solving, or multi-perspective analysis.

## Why?

- **🤝 Combine strengths** - Get Claude's code analysis + ChatGPT's architecture suggestions
- **🔄 Iterate together** - AIs can build on each other's ideas
- **📋 Structured** - No ambiguity, reliable parsing, session tracking
- **🔧 Configurable** - Name your AIs anything, extend the protocol
- **🎯 Intent-driven** - Question, status update, code patch, or note

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/ai-crosstalk.git
   cd ai-crosstalk
   npm install
   ```

2. **Configure your setup**
   ```bash
   cp config.example.json config.json
   # Edit config.json with your names
   ```

3. **Send a message**
   ```bash
   ./envelope.js send --context "api-design" --intent QUESTION --body "How should we handle auth?"
   ```

4. **Copy the envelope, paste it to the other AI**

5. **Get the response, parse it**
   ```bash
   pbpaste | ./envelope.js parse
   ```

That's it! 🎉

## How It Works

The protocol uses versioned **envelope structures** that wrap messages between AIs:

```
[[AI-A→AI-B v1]]
user: your-name
session: 2025-10-08T15:30Z a7f3d1
context: websocket-reconnect
intent: QUESTION
body: |
  What's your recommended approach for reconnection?
sig: none
[[END]]
```

See [PROTOCOL.md](PROTOCOL.md) for the full specification.

## Configuration

Create `config.json` to customize names:

```json
{
  "user": "your-name",
  "sender": "CLAUDE",
  "receiver": "CHATGPT",
  "version": "1"
}
```

**Examples:**
- Claude ↔ ChatGPT
- Claude ↔ Gemini
- ChatGPT ↔ Perplexity
- Any combination!

## Tools

### Command Line Script

The `envelope.js` script handles all envelope operations:

```bash
# Simple message
./envelope.js send --context "auth-flow" --intent QUESTION --body "Should we use JWT?"

# Multiline from file
cat implementation.md | ./envelope.js send --context "review" --intent PATCH --body -

# Parse response
pbpaste | ./envelope.js parse
```

### Claude Code Integration

If you're using [Claude Code](https://claude.com/claude-code), custom slash commands are included:

- `/brother` - Send a message with guided envelope formatting
- `/parse-brother` - Parse and process responses

Simply open this directory in Claude Code and the commands will be available.

## Use Cases

### 💡 Collaborative Problem Solving
- **Claude** analyzes your codebase structure
- **ChatGPT** suggests architectural improvements
- They discuss trade-offs and converge on a solution

### 🔍 Code Review from Multiple Perspectives
- **Claude** reviews for security vulnerabilities
- **Gemini** checks performance optimizations
- Get comprehensive feedback on your code

### 📚 Research & Learning
- **Claude** explains a complex algorithm
- **ChatGPT** provides alternative implementations
- Compare explanations to deepen understanding

### 🐛 Debugging Assistance
- **Claude** identifies the bug location
- **ChatGPT** suggests fixes
- Cross-validate solutions before applying

## Advanced Usage

### Multiline Messages

```bash
# From file
cat patch.diff | ./envelope.js send --context "bug-fix" --intent PATCH --body -

# From heredoc
./envelope.js send --context "api-design" --intent QUESTION --body - <<EOF
How should I structure the REST endpoints for:
- User authentication
- Resource management
- Webhook handling
EOF
```

### Parsing Responses

```bash
# From clipboard (macOS)
pbpaste | ./envelope.js parse

# From file
cat response.txt | ./envelope.js parse

# Direct pipe
echo '[[AI-B→AI-A v1]]
session: 2025-10-08T15:30Z a7f3d1
response: |
  Here is my answer...
[[END]]' | ./envelope.js parse
```

### Features
- 📋 **Auto-clipboard** (macOS) - Envelopes copied automatically
- 🎨 **Colored output** - Beautiful terminal formatting
- 📝 **Multiline support** - Use `--body -` for stdin input
- 🔧 **Configurable** - Customize all names via `config.json`

## Intent Types

Choose the intent that best describes your message:

| Intent | Purpose | Example |
|--------|---------|---------|
| **QUESTION** | Ask for advice or information | "How should I implement this feature?" |
| **STATUS** | Share progress or current state | "I've completed the auth module" |
| **PATCH** | Share code, diffs, or implementations | "Here's my proposed solution: ..." |
| **NOTE** | Share information (FYI) | "The API limits requests to 100/min" |

## Project Structure

```
ai-crosstalk/
├── envelope.js           # CLI tool for sending/parsing
├── config.json          # Your local config (gitignored)
├── config.default.json  # Default fallback config
├── config.example.json  # Example configuration
├── PROTOCOL.md          # Full protocol specification
├── CLAUDE.md           # Quick-start guide for Claude
├── .claude/            # Claude Code integration
│   └── commands/       # Slash commands
└── examples/           # Example conversations
```

## Contributing

Contributions welcome! Ideas:

- Support for other platforms (Windows clipboard, Linux xclip)
- Additional output formats (JSON, markdown)
- Session history tracking
- Multi-turn conversation threading
- Alternative transport methods

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for AI collaboration. Made by humans (and AIs). 🤖🤝🤖**
