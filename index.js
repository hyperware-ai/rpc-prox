const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const app = express();
const server = http.createServer(app);

// Target WebSocket server
const targetWsUrl = 'wss://optimism-mainnet.infura.io/ws/v3/SOME_KEY';

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', (clientSocket, req) => {
  console.log('New client connected');

  const clientDomain = req.headers.host;
  console.log(`New client connected from domain: ${clientDomain}`);

  // Connect to the target WebSocket server
  const targetSocket = new WebSocket(targetWsUrl);

  clientSocket.on('message', (message) => {
    try {
      let decodedMessage = message.toString();
      const parsedMessage = JSON.parse(decodedMessage);
      
      // Check the method type
      if (parsedMessage.method === 'eth_subscribe') {
        console.log('Forwarding eth_subscribe request');
        // Forward eth_subscribe request to target
        if (targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(decodedMessage);
        }
      } else if (parsedMessage.method === 'eth_call') {
        console.log('Forwarding eth_call request');
        // Forward eth_call request to target
        if (targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(decodedMessage);
        }
      } else {
        console.log('Forwarding unknown request:', parsedMessage.method);
        if (targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(decodedMessage);
        }
      }
    } catch (err) {
      console.error('Error parsing or forwarding message:', err);
    }
  });

  targetSocket.on('message', (message) => {
    try {
      let decodedMessage = message.toString();
      const parsedMessage = JSON.parse(decodedMessage);
      
      // For subscriptions (e.g., eth_subscribe), forward messages to the client
      if (parsedMessage.params && parsedMessage.params.subscription) {
        console.log('Forwarding subscription update');
      }

      // Send response back to the client
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(decodedMessage);
      }
    } catch (err) {
      console.error('Error parsing or forwarding target message:', err);
    }
  });
  // Handle client disconnection
  clientSocket.on('close', () => {
    targetSocket.close();
    console.log('Client disconnected');
  });

  // Handle target server disconnection
  targetSocket.on('close', () => {
    clientSocket.close();
    console.log('Target server disconnected');
  });

  // Handle errors
  clientSocket.on('error', (err) => console.error('Client socket error:', err));
  targetSocket.on('error', (err) => console.error('Target socket error:', err));
});

// Start the HTTP server
server.listen(8080, () => {
  console.log('WebSocket proxy server running on port 8080');
});
