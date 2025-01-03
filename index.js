/**
 * Minimal WebSocket proxy with logging and .env config
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
 
 // Read the remote WebSocket URL from environment variables
 const REMOTE_URL = process.env.REMOTE_URL;
 if (!REMOTE_URL) {
   console.error('Error: REMOTE_URL not defined in .env');
   process.exit(1);
 }
 
 // Create a local WebSocket server
 const wss = new WebSocket.Server({ port: 8080 }, () => {
   console.log('Local WebSocket proxy server running at ws://localhost:8080');
 });
 
 wss.on('connection', (clientSocket) => {
   console.log('[client] New client connected to proxy');
 
   // Create a connection to the remote server
   const remoteSocket = new WebSocket(REMOTE_URL);
 
   // Remote socket 'open' event
   remoteSocket.on('open', () => {
     console.log(`[remote] Connected to remote server at ${REMOTE_URL}`);
   });
 
   // Forward messages from the remote server to the client
   remoteSocket.on('message', (data) => {
     console.log(`[remote -> client] ${data}`);
     clientSocket.send(data);
   });
 
   // Handle remote socket close
   remoteSocket.on('close', (code, reason) => {
     console.log(`[remote] Connection closed (code=${code}, reason=${reason})`);
     clientSocket.close(code, reason);
   });
 
   // Handle remote socket errors
   remoteSocket.on('error', (err) => {
     console.error('[remote] Error:', err);
     // Close client socket with an error status
     clientSocket.close(1011, 'Remote WS error');
   });
 
   // Forward messages from the client to the remote server
   clientSocket.on('message', (data) => {
     console.log(`[client -> remote] ${data}`);
     // Wait until the remote socket is open before sending
     if (remoteSocket.readyState === WebSocket.OPEN) {
       remoteSocket.send(data);
     } else {
       console.warn('[client] Tried to send data but remote socket is not open.');
     }
   });
 
   // Handle client socket close
   clientSocket.on('close', (code, reason) => {
     console.log(`[client] Connection closed (code=${code}, reason=${reason})`);
     remoteSocket.close(code, reason);
   });
 
   // Handle client socket errors
   clientSocket.on('error', (err) => {
     console.error('[client] Error:', err);
     // Close remote socket with an error status
     remoteSocket.close(1011, 'Client WS error');
   });
 });
 