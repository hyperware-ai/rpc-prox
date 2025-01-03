/**
 * Minimal WebSocket proxy with timestamped logging, .env config,
 * and unique client connection IDs.
 *
 * 1. Install dependencies:
 *    npm install ws dotenv
 *
 * 2. Create a .env file in the same directory with:
 *    REMOTE_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
 *
 * 3. Run this file:
 *    node proxy.js
 *
 * 4. Connect your client to ws://localhost:8080
 *    Messages will be proxied to the REMOTE_URL specified in .env
 */

 require('dotenv').config();
 const WebSocket = require('ws');
 
 // Helpers for timestamped logs
 function tsLog(...args) {
   console.log(`[${new Date().toISOString()}]`, ...args);
 }
 function tsError(...args) {
   console.error(`[${new Date().toISOString()}]`, ...args);
 }
 
 // Read the remote WebSocket URL from environment variables
 const REMOTE_URL = process.env.REMOTE_URL;
 if (!REMOTE_URL) {
   tsError('Error: REMOTE_URL not defined in .env');
   process.exit(1);
 }
 
 // Keep track of each new client connection with a unique ID
 let connectionCounter = 0;
 
 // Create a local WebSocket server
 const wss = new WebSocket.Server({ port: 8080 }, () => {
   tsLog('Debugging WebSocket proxy server running at ws://localhost:8080');
 });
 
 wss.on('connection', (clientSocket) => {
   // Increment the counter and assign an ID to this connection
   const clientId = ++connectionCounter;
 
   tsLog(`[client #${clientId}] New client connected to proxy`);
 
   // Create a connection to the remote server
   const remoteSocket = new WebSocket(REMOTE_URL);
 
   // Remote socket 'open' event
   remoteSocket.on('open', () => {
     tsLog(`[remote -> client #${clientId}] Connected to ${REMOTE_URL}`);
   });
 
   // Forward messages from the remote server to the client
   remoteSocket.on('message', (data) => {
     tsLog(`[remote -> client #${clientId}] ${data}`);
     clientSocket.send(data);
   });
 
   // Handle remote socket close
   remoteSocket.on('close', (code, reason) => {
     tsLog(`[remote -> client #${clientId}] Connection closed (code=${code}, reason=${reason})`);
     clientSocket.close(code, reason);
   });
 
   // Handle remote socket errors
   remoteSocket.on('error', (err) => {
     tsError(`[remote -> client #${clientId}] Error:`, err);
     clientSocket.close(1011, 'Remote WS error');
   });
 
   // Forward messages from the client to the remote server
   clientSocket.on('message', (data) => {
     tsLog(`[client #${clientId} -> remote] ${data}`);
 
     // Wait until the remote socket is open before sending
     if (remoteSocket.readyState === WebSocket.OPEN) {
       remoteSocket.send(data);
     } else {
       tsLog(`[client #${clientId}] Tried to send data but remote socket is not open.`);
     }
   });
 
   // Handle client socket close
   clientSocket.on('close', (code, reason) => {
     tsLog(`[client #${clientId}] Connection closed (code=${code}, reason=${reason})`);
     remoteSocket.close(1011, 'Client WS close');
   });
 
   // Handle client socket errors
   clientSocket.on('error', (err) => {
     tsError(`[client #${clientId}] Error:`, err);
     remoteSocket.close(1011, 'Client WS error');
   });
 });
 