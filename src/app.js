require('dotenv').config();
const express = require('express');
const app = express();
// const routes = require('./routes.js');
const http = require('http');
const WebSocket = require('ws');

// app.use(routes);
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

// Read the remote WebSocket URL from environment variables
const REMOTE_URL = process.env.REMOTE_URL || 'wss://echo.websocket.org';

// Create an HTTP server manually
const server = http.createServer((req, res) => {
    // Just respond with something if an HTTP request comes in
    res.writeHead(200);
    res.end('This is a WS proxy server.\n');
});

// Create a WebSocket server in "noServer" mode
const wss = new WebSocket.Server({ noServer: true });

// Our own connection counter for logging
let connectionCounter = 0;

/**
 * "upgrade" event fires whenever a client attempts to upgrade
 * from HTTP to WebSocket.
 */
server.on('upgrade', (req, socket, head) => {
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
    tsLog(`[client #${clientId}] Handshake complete (remote is open)`);

    // Forward messages client -> remote
    clientSocket.on('message', (data) => {
        tsLog(`[client #${clientId} -> remote] ${data}`);
        if (remoteSocket.readyState === WebSocket.OPEN) {
            remoteSocket.send(data);
        } else {
            tsLog(`[client #${clientId}] Remote not open for sending.`);
        }
    });

    // Forward messages remote -> client
    remoteSocket.on('message', (data) => {
        tsLog(`[remote -> client #${clientId}] ${data}`);
        clientSocket.send(data);
    });

    // Close events
    clientSocket.on('close', (code, reason) => {
        tsLog(`[client #${clientId}] Closed (code=${code}, reason=${reason})`);
        if (code !== 1006) remoteSocket.close(code, reason);
    });
    remoteSocket.on('close', (code, reason) => {
        tsLog(`[remote -> client #${clientId}] Closed (code=${code}, reason=${reason})`);
        clientSocket.close(code, reason);
    });

    // Error events
    clientSocket.on('error', (err) => {
        tsError(`[client #${clientId}] Error:`, err);
        remoteSocket.close(1011, 'Client error');
    });
    remoteSocket.on('error', (err) => {
        tsError(`[remote -> client #${clientId}] Error:`, err);
        clientSocket.close(1011, 'Remote error');
    });
});

module.exports = app;