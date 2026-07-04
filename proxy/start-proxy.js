#!/usr/bin/env node
import { startModelProxy } from './model-proxy.js';

const BACKEND_DEFS = {
    mimo: { url: 'https://api.xiaomimimo.com/anthropic', keyEnv: 'MIMO_API_KEY' },
};

// Legacy mode: start-proxy.js <targetUrl> <apiKey> (used by mimoclaude.sh/ps1)
const targetUrl = process.argv[2] || process.env.MIMOCLAUDE_TARGET_URL;
const apiKey = process.argv[3] || process.env.MIMOCLAUDE_API_KEY;

if (targetUrl && apiKey) {
    // Legacy single-backend mode
    const backends = {};
    for (const [name, def] of Object.entries(BACKEND_DEFS)) {
        const key = process.env[def.keyEnv];
        if (key) backends[name] = { url: def.url, apiKey: key };
    }
    const hasBackends = Object.keys(backends).length > 0;

    const { port } = await startModelProxy({
        targetUrl,
        apiKey,
        backends: hasBackends ? backends : undefined,
        defaultMode: hasBackends ? undefined : undefined,
    });
    console.log(port);
} else {
    // Standalone mode with live toggle
    const backends = {};
    for (const [name, def] of Object.entries(BACKEND_DEFS)) {
        const key = process.env[def.keyEnv];
        backends[name] = { url: def.url, apiKey: key || null };
    }

    const fallbackUrl = backends.mimo?.url || 'https://api.xiaomimimo.com/anthropic';
    const fallbackKey = backends.mimo?.apiKey || 'unused';

    const args = process.argv.slice(2);
    const modeFlag = args.indexOf('--mode');
    const defaultMode = modeFlag >= 0 ? args[modeFlag + 1] : 'anthropic';
    const portFlag = args.indexOf('--port');
    const port = portFlag >= 0 ? parseInt(args[portFlag + 1], 10) : 3200;

    const proxy = await startModelProxy({
        targetUrl: fallbackUrl,
        apiKey: fallbackKey,
        startPort: port,
        backends,
        defaultMode,
    });

    console.log(`Proxy on :${proxy.port} (mode: ${defaultMode})`);
    console.log(`Switch: curl -sX POST http://127.0.0.1:${proxy.port}/_proxy/mode -d backend=mimo`);
    console.log(`Status: curl -s http://127.0.0.1:${proxy.port}/_proxy/status`);
}
