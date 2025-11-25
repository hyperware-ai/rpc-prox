const WebSocket = require('ws');

function parseProviderConfigurations() {
    try {
        const raw = process.env.RPC_PROVIDER_CONFIGURATIONS;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((entry, index) => ({
                name: entry?.name || `provider-${index}`,
                url: entry?.url,
            }))
            .filter((entry) => typeof entry.url === 'string' && entry.url.length > 0);
    } catch (error) {
        console.log('[ws-rpc] Failed to parse RPC_PROVIDER_CONFIGURATIONS:', error);
        return [];
    }
}

const providerConfigs = parseProviderConfigurations();
let activeProviderIndex = Number(process.env.DEFAULT_RPC_PROVIDER_CONFIGURATION);
if (!Number.isInteger(activeProviderIndex) || activeProviderIndex < 0 || activeProviderIndex >= providerConfigs.length) {
    activeProviderIndex = 0;
}

function getActiveConfig() {
    return providerConfigs[activeProviderIndex];
}

function getActiveProviderUrl() {
    const cfg = getActiveConfig();
    if (!cfg) throw new Error('No RPC provider configurations available');
    return cfg.url;
}

function getActiveProviderName() {
    const cfg = getActiveConfig();
    return cfg ? cfg.name : 'unconfigured';
}

function advanceProvider(reason) {
    if (providerConfigs.length <= 1) {
        console.log('[ws-rpc] Only one provider configured; cannot advance');
        return getActiveConfig();
    }
    const prev = getActiveConfig();
    activeProviderIndex = (activeProviderIndex + 1) % providerConfigs.length;
    const next = getActiveConfig();
    console.log(`[ws-rpc] Switching provider from ${prev?.name} to ${next?.name}${reason ? ` (${reason})` : ''}`);
    notifyProviderChange(prev?.name, next?.name, reason);
    return next;
}

function setActiveProvider(identifier, reason = 'manual override') {
    if (!providerConfigs.length) {
        return { ok: false, message: 'No RPC providers configured', provider: null };
    }
    let targetIndex = null;
    if (typeof identifier === 'number') {
        targetIndex = identifier;
    } else if (typeof identifier === 'string') {
        const lower = identifier.trim().toLowerCase();
        targetIndex = providerConfigs.findIndex((cfg) => cfg.name.toLowerCase() === lower);
        if (targetIndex === -1 && /^[0-9]+$/.test(lower)) {
            targetIndex = Number(lower);
        }
    }
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= providerConfigs.length) {
        return { ok: false, message: `Unsupported provider "${identifier}"`, provider: getActiveProviderName() };
    }
    const previous = getActiveProviderName();
    activeProviderIndex = targetIndex;
    const current = getActiveProviderName();
    console.log(`[ws-rpc] Provider manually set from ${previous} to ${current} (${reason})`);
    notifyProviderChange(previous, current, reason);
    return { ok: true, changed: previous !== current, provider: current };
}

let heartbeatTimer = null;
const changeListeners = new Set();

function notifyProviderChange(previous, current, reason) {
    for (const fn of changeListeners) {
        try {
            fn({ previous, current, reason });
        } catch (err) {
            console.log('[ws-rpc] Provider change listener error:', err?.message || err);
        }
    }
}

async function heartbeatOnce(timeoutMs = 4000) {
    const cfg = getActiveConfig();
    if (!cfg) throw new Error('No RPC providers configured');
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(cfg.url);
        const timer = setTimeout(() => {
            ws.terminate();
            reject(new Error('heartbeat timeout'));
        }, timeoutMs);

        ws.on('open', () => {
            const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] });
            ws.send(payload);
        });

        ws.on('message', () => {
            clearTimeout(timer);
            ws.close();
            resolve(true);
        });

        ws.on('error', (err) => {
            clearTimeout(timer);
            ws.terminate();
            reject(err);
        });

        ws.on('close', () => {
            clearTimeout(timer);
        });
    });
}

function startHeartbeat(intervalMs = 10000, timeoutMs = 4000) {
    if (heartbeatTimer) return;
    console.log(`[ws-rpc] Starting heartbeat every ${intervalMs}ms (timeout ${timeoutMs}ms), providers=${providerConfigs.length}`);
    if (!providerConfigs.length) {
        console.log('[ws-rpc] Heartbeat not started: no providers configured');
        return;
    }
    const tick = async () => {
        console.log(`[ws-rpc] Heartbeat check for ${getActiveProviderName()}`);
        try {
            await heartbeatOnce(timeoutMs);
        } catch (err) {
            console.log(`[ws-rpc] Heartbeat failed on ${getActiveProviderName()}: ${err?.message || err}`);
            advanceProvider('heartbeat failure');
        }
    };
    heartbeatTimer = setInterval(tick, intervalMs);
    tick().catch((err) => console.log('[ws-rpc] Heartbeat initial check error:', err?.message || err));
}

function onProviderChange(listener) {
    changeListeners.add(listener);
    return () => changeListeners.delete(listener);
}

module.exports = {
    getActiveProviderUrl,
    getActiveProviderName,
    advanceProvider,
    setActiveProvider,
    startHeartbeat,
    getActiveConfig,
    onProviderChange,
};
