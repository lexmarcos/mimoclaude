# Model Proxy for Remote Control

When using `claude remote-control`, the bridge authentication must go to Anthropic while model API calls go to Xiaomi MiMo. This proxy handles the split.

## How it works

```
claude remote-control
  ├── Bridge WebSocket → wss://bridge.claudeusercontent.com (Anthropic, hardcoded)
  └── Model API calls  → http://localhost:3200 (this proxy)
                            ├── /v1/messages → api.xiaomimimo.com (with MiMo key)
                            └── everything else → api.anthropic.com (passthrough)
```

## Usage

```javascript
import { startModelProxy } from './model-proxy.js';

const proxy = await startModelProxy({
    targetUrl: 'https://api.xiaomimimo.com/anthropic',
    apiKey: process.env.MIMO_API_KEY,
});

console.log(`Proxy on port ${proxy.port}`);

// Set env vars for claude remote-control:
// ANTHROPIC_BASE_URL=http://127.0.0.1:${proxy.port}
// ANTHROPIC_DEFAULT_OPUS_MODEL=mimo-v2.5-pro
// (do NOT set ANTHROPIC_AUTH_TOKEN — OAuth handles bridge auth)

// When done:
proxy.close();
```

## Live switching

The proxy supports switching between MiMo and Anthropic mid-session:

```bash
# Switch to MiMo
curl -sX POST http://127.0.0.1:3200/_proxy/mode -d "backend=mimo"

# Switch to Anthropic
curl -sX POST http://127.0.0.1:3200/_proxy/mode -d "backend=anthropic"

# Check status
curl -s http://127.0.0.1:3200/_proxy/status

# View cost savings
curl -s http://127.0.0.1:3200/_proxy/cost
```

## Why a proxy?

Claude Code's remote control uses two separate channels:
1. **Bridge** (WebSocket to `wss://bridge.claudeusercontent.com`) — hardcoded, needs Anthropic OAuth
2. **Model API** (HTTP to `ANTHROPIC_BASE_URL`) — configurable

Setting `ANTHROPIC_AUTH_TOKEN` to a MiMo key breaks the bridge. The proxy lets you keep Anthropic OAuth for the bridge while routing model calls to MiMo.
