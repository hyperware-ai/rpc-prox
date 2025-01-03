const WebSocket = require('ws');

// Replace with your Infura Project ID or custom endpoint
const INFURA_WSS_URL = 'wss://mainnet.infura.io/ws/v3/d449da9257d848298e5e63fcd03a45b6';

// Create a local WebSocket server for clients to connect to
const server = new WebSocket.Server({ port: 8080 }, () => {
  console.log('Local WebSocket proxy server running on ws://localhost:8080');
});

server.on('connection', (clientSocket) => {
  console.log('New client connected to the proxy');

  // Create a connection to the Infura WSS endpoint
  const infuraSocket = new WebSocket(INFURA_WSS_URL);

  // When Infura connection is established, notify
  infuraSocket.on('open', () => {
    console.log('Connected to Infura WSS endpoint');
    console.log(infuraSocket.readyState);	  
  });

  // Forward messages from client to Infura
  clientSocket.on('message', (message) => {
    // Optionally, you can inspect or modify messages before forwarding
    if (infuraSocket.readyState === WebSocket.OPEN) {
    console.log("sending message");
    console.log(infuraSocket.readyState);
    infuraSocket.send(message);
    } else {
    console.log("not ready yet");
    console.log(infuraSocket.readyState);
    }
  });

  // Forward messages from Infura back to client
  infuraSocket.on('message', (message) => {
    clientSocket.send(message);
  });

  // Handle Infura socket errors
  infuraSocket.on('error', (error) => {
    console.error('Infura socket error:', error);
    clientSocket.close(1011, 'Infura connection error');
  });

  // Handle client socket closure
  clientSocket.on('close', () => {
    console.log('Client disconnected from proxy');
    infuraSocket.close();
  });

  // Handle client socket errors
  clientSocket.on('error', (error) => {
    console.error('Client socket error:', error);
    infuraSocket.close(1011, 'Client connection error');
  });
});

