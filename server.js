require('dotenv').config();
const shell = require('shelljs');
const app = require("./src/app.js");
const http = require("http");
const WebSocket = require('ws');
const NodeCache = require("node-cache");
const cache = new NodeCache();

const port = 8080;
const host = '127.0.0.1';

/**
 * Delayed WebSocket Proxy: 
 * The handshake with the client won't complete until we confirm 
 * the remote server is actually connected.
 */

// For timestamped logs
function tsLog(...args) {
    console.log(`[${new Date().toISOString()}]`, ...args);
}
function tsError(...args) {
    console.error(`[${new Date().toISOString()}]`, ...args);
}

cache.set('restrictedProxy', false);
app.set('cache', cache);

// Read the remote WebSocket URL from environment variables
const REMOTE_URL = process.env.REMOTE_URL || 'wss://echo.websocket.org';

// Create an HTTP server manually
const server = http.createServer(app);

// Create a WebSocket server in "noServer" mode
const wss = new WebSocket.Server({ noServer: true });

// Our own connection counter for logging
let connectionCounter = 0;

/**
 * "upgrade" event fires whenever a client attempts to upgrade
 * from HTTP to WebSocket.
 */
server.on('upgrade', (req, socket, head) => {
    // Step 0: Check headers
    console.log(req.headers);
    try {
        const testcache = app.get('cache');
        const currentValue = testcache.get("restrictedProxy");

        if (currentValue) {
            tsLog("ENFORCING proxy restrictions")
            const proxyUser = req.headers.host.split('.')[0];
            tsLog(`proxyUser: ${proxyUser}`);
        
            const lastHyphenIndex = proxyUser.lastIndexOf('-');
            if (lastHyphenIndex === -1) {
                tsLog(`BAD subdomain format: "${proxyUser}"`);
            } else {
                const node = proxyUser.substring(0, lastHyphenIndex);
                const shortcode = proxyUser.substring(lastHyphenIndex + 1);
                if (!cache.has(`${shortcode}-whitelist`)) {
                    tsLog(`No whitelist cache for client shortcode: "${shortcode}"`);
                    /*socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                    socket.destroy();
                    return;*/
                } else { 
                    const whitelist = cache.get(`${shortcode}-whitelist`);
                    if (whitelist.has(node)) {
                        tsLog(`node: ${node} is WHITELISTED, checking whitelist entry and Authorization header`);
                        tsLog(req.headers.authorization)
                        tsLog(`${whitelist.get(node)}`)
                        if (`${whitelist.get(node)}` === "allowed") {
                            tsLog(`node: ${node} has an ALLOWED whitelist entry`);
                        } else if (`${whitelist.get(node)}` === "banned") {
                            tsLog(`node: ${node} has a BANNED whitelist entry`);
                            /*socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                            socket.destroy();
                            return;*/
                        } else if (req.headers.authorization === `Bearer ${whitelist.get(node)}`) {
                            tsLog(`node: ${node} has a MATCHING Authorization header`);
                        } else {
                            tsLog(`node: ${node} has a NON-matching Authorization header`);
                            /*socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                            socket.destroy();
                            return;*/
                        }
                    } else {
                        tsLog(`node: ${node} is NOT whitelisted`);
                        /*socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                        socket.destroy();
                        return;*/
                    }
                }
            }            
        } else {
            tsLog("Proxy restrictions are NOT ENFORCED")
        }
    } catch (error) {
        console.log(error);
        //return res.status(500).json({ error });
    }

    // Step 1: Attempt a connection to the REMOTE_URL
    const remoteSocket = new WebSocket(REMOTE_URL);

    remoteSocket.on('open', () => {
        tsLog(`[remote] Connected to ${REMOTE_URL}`);

        // Step 2: Once remote is open, upgrade the incoming client connection
        wss.handleUpgrade(req, socket, head, (clientSocket) => {
            // Step 3: Emit the usual 'connection' event
            wss.emit('connection', clientSocket, req, remoteSocket);
        });
    });

    remoteSocket.on('error', (err) => {
        tsError('[remote] Failed to connect:', err);
        // If remote fails, return an HTTP 503 to the client, then destroy
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
        socket.destroy();
    });
});

// Handle new client connections on the wss
wss.on('connection', (clientSocket, req, remoteSocket) => {
    const clientId = ++connectionCounter;
    //console.log(req);
    const clientIdAndHost = `${clientId} ${req.headers.host}`;
    const proxyUser = req.headers.host.split('.')[0];
    tsLog(`[client #${clientIdAndHost}] Handshake complete (remote is open)`);
    tsLog(`proxyUser: ${proxyUser}`);

    const lastHyphenIndex = proxyUser.lastIndexOf('-');
    if (lastHyphenIndex === -1) {
        tsLog(`BAD subdomain format: "${proxyUser}"`);
    } else {
        const node = proxyUser.substring(0, lastHyphenIndex);
        const shortcode = proxyUser.substring(lastHyphenIndex + 1);
        if (!cache.has(`${shortcode}-userConnections`)) {
            tsLog(`No userConnections cache for client shortcode: "${shortcode}", creating it`);
            cache.set(`${shortcode}-userConnections`, new Map());
        }
        const userConnections = cache.get(`${shortcode}-userConnections`);
        if (userConnections.has(node)) {
            userConnections.set(node, userConnections.get(node) + 1);
            tsLog(`node: ${node} updated userConnections entry to ${userConnections.get(node)}`);
        } else {
            userConnections.set(node, 1);
            tsLog(`Added new ${shortcode}-userConnections entry for node: ${node}`);
        }
        cache.set(`${shortcode}-userConnections`, userConnections);
    }

    // Forward messages client -> remote
    clientSocket.on('message', (data) => {
        tsLog(`[client #${clientIdAndHost} -> remote] ${data}`);
        if (remoteSocket.readyState === WebSocket.OPEN) {
            remoteSocket.send(data);

            const lastHyphenIndex = proxyUser.lastIndexOf('-');
            if (lastHyphenIndex === -1) {
                tsLog(`BAD subdomain format: "${proxyUser}"`);
            } else {
                const node = proxyUser.substring(0, lastHyphenIndex);
                const shortcode = proxyUser.substring(lastHyphenIndex + 1);
                const userConnections = cache.get(`${shortcode}-userConnections`);
                if (userConnections.has(node)) {
                    userConnections.set(node, userConnections.get(node) + 1);
                    tsLog(`node: ${node} updated userConnections entry to ${userConnections.get(node)}`);
                } else {
                    userConnections.set(node, 1);
                    tsLog(`Added new ${shortcode}-userConnections entry for node: ${node}`);
                }
                cache.set(`${shortcode}-userConnections`, userConnections);
            }

        } else {
            tsLog(`[client #${clientIdAndHost}] Remote not open for sending.`);
        }
    });

    // Forward messages remote -> client
    remoteSocket.on('message', (data) => {
        tsLog(`[remote -> client #${clientIdAndHost}] ${data}`);
        const textData = data.toString(); // Convert Buffer to string
        clientSocket.send(textData);

        const lastHyphenIndex = proxyUser.lastIndexOf('-');
        if (lastHyphenIndex === -1) {
            tsLog(`BAD subdomain format: "${proxyUser}"`);
        } else {
            const node = proxyUser.substring(0, lastHyphenIndex);
            const shortcode = proxyUser.substring(lastHyphenIndex + 1);
            const userConnections = cache.get(`${shortcode}-userConnections`);
            if (userConnections.has(node)) {
                userConnections.set(node, userConnections.get(node) + 1);
                tsLog(`node: ${node} updated userConnections entry to ${userConnections.get(node)}`);
            } else {
                userConnections.set(node, 1);
                tsLog(`Added new ${shortcode}-userConnections entry for node: ${node}`);
            }
            cache.set(`${shortcode}-userConnections`, userConnections);
        }

    });

    // Close events
    clientSocket.on('close', (code, reason) => {
        tsLog(`[client #${clientIdAndHost}] Closed (code=${code}, reason=${reason})`);
        if (code !== 1006) {
            remoteSocket.close(code, reason);
        } else {
            tsLog(`[client #${clientIdAndHost} -> remote] Intercepting 1006, sending 1011 to remote`);
            remoteSocket.close(1011, reason);
        }
    });
    remoteSocket.on('close', (code, reason) => {
        tsLog(`[remote -> client #${clientIdAndHost}] Closed (code=${code}, reason=${reason})`);
        if (code !== 1006) {
            clientSocket.close(code, reason);
        } else {
            tsLog(`[client #${clientIdAndHost} -> remote] Intercepting 1006, sending 1011 to remote`);
            clientSocket.close(1011, reason);
        }
    });

    // Error events
    clientSocket.on('error', (err) => {
        tsError(`[client #${clientIdAndHost}] Error:`, err);
        remoteSocket.close(1011, 'Client error');
    });
    remoteSocket.on('error', (err) => {
        tsError(`[remote -> client #${clientIdAndHost}] Error:`, err);
        clientSocket.close(1011, 'Remote error');
    });
});

server.listen(port, host, () => {
    console.log(`http server / ws proxy is running locally on ${port} port...`);
    console.log(process.version);
});

try {
    shortcodeArray = JSON.parse(process.env.ASSOCIATED_SHORTCODES)
    const cache = app.get('cache');
    for (let i = 0; i < shortcodeArray.length; i++) {
        console.log(shortcodeArray[i])
        cache.set(`${shortcodeArray[i]}-whitelist`, new Map());
        const whitelist = cache.get(`${shortcodeArray[i]}-whitelist`);
        const whitelistedNodes = shell.exec(`curl ${process.env.BACKEND_URL}/get-ship-tokens/${shortcodeArray[i]}`, { silent: true });
        const nodeArray = JSON.parse(whitelistedNodes.stdout)
        for (let j = 0; j < nodeArray.length; j++) {
            console.log(nodeArray[j].node)
            if (nodeArray[j].rpc_token === null) {
                console.log("allowed");
                whitelist.set(nodeArray[j].node, "allowed");
            } else {
                console.log(nodeArray[j].rpc_token)
                whitelist.set(nodeArray[j].node, nodeArray[j].rpc_token);
            }
        }
        cache.set(`${shortcodeArray[i]}-whitelist`, whitelist);
    }
} catch (error) {
    console.log(error);
}