# Example: WebSocket Reconnection Strategy

This example shows Claude asking ChatGPT for advice on implementing WebSocket reconnection logic.

## Claude → ChatGPT

```
[[CLAUDE→CHATGPT v1]]
user: alice
session: 2025-10-08T14:23Z a7f3d1
context: websocket-reconnect
intent: QUESTION
body: |
  I'm implementing WebSocket reconnection logic for a real-time chat app.
  Should I use exponential backoff or fixed intervals?
  Any edge cases I should watch out for?
sig: none
[[END]]
```

## ChatGPT → Claude

```
[[CHATGPT→CLAUDE v1]]
session: 2025-10-08T14:23Z a7f3d1
response: |
  I recommend exponential backoff with jitter for several reasons:

  1. **Exponential backoff** prevents overwhelming the server during outages
     - Start: 1s delay
     - Double on each retry: 2s, 4s, 8s, 16s...
     - Cap at max delay (e.g., 30s)

  2. **Add jitter** (±20% random variance) to prevent thundering herd
     - If 1000 clients disconnect simultaneously, they won't all retry at once

  3. **Maximum retry limit** (e.g., 10 attempts before giving up)
     - Show user-friendly error after limit
     - Allow manual retry

  Edge cases to handle:
  - Browser going offline (use navigator.onLine)
  - Server maintenance (respect Retry-After headers)
  - Authentication token expiry (refresh before reconnect)
  - Multiple tabs (use SharedWorker or BroadcastChannel to coordinate)

  Example pattern:
    let retries = 0;
    const maxRetries = 10;
    const baseDelay = 1000;

    function reconnect() {
      if (retries >= maxRetries) return showError();
      const delay = Math.min(baseDelay * Math.pow(2, retries), 30000);
      const jitter = delay * (0.8 + Math.random() * 0.4);
      setTimeout(() => connect(), jitter);
      retries++;
    }
[[END]]
```

## Claude → ChatGPT (Follow-up)

```
[[CLAUDE→CHATGPT v1]]
user: alice
session: 2025-10-08T14:23Z a7f3d1
context: websocket-reconnect
intent: QUESTION
body: |
  Great advice! How should I handle the SharedWorker coordination?
  I haven't used that pattern before.
sig: none
[[END]]
```

## ChatGPT → Claude (Follow-up response)

```
[[CHATGPT→CLAUDE v1]]
session: 2025-10-08T14:23Z a7f3d1
response: |
  SharedWorker lets multiple tabs share one WebSocket connection:

  **worker.js:**
    let socket = null;
    const ports = [];

    onconnect = (e) => {
      const port = e.ports[0];
      ports.push(port);

      if (!socket) {
        socket = new WebSocket('wss://...');
        socket.onmessage = (msg) => {
          // Broadcast to all tabs
          ports.forEach(p => p.postMessage(msg.data));
        };
      }

      port.onmessage = (e) => {
        socket.send(e.data);
      };
    };

  **main.js:**
    const worker = new SharedWorker('worker.js');
    worker.port.onmessage = (e) => {
      console.log('Message from socket:', e.data);
    };
    worker.port.postMessage('Hello from tab');

  Note: SharedWorker support is limited (no Safari). For broader support,
  use BroadcastChannel + localStorage to elect one tab as "leader".
[[END]]
```

---

**Outcome:** Claude got comprehensive advice on reconnection strategy and learned about coordinating WebSocket connections across multiple tabs.
