const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');

const BACKEND_WS_URL = 'wss://optimism-mainnet.infura.io/ws/v3/d449da9257d848298e5e63fcd03a45b6'; // e.g., Infura endpoint

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('A new Socket.IO client connected.');

  // 1. Create a WebSocket connection to the backend server
  const backendWs = new WebSocket(BACKEND_WS_URL);

  // 2. When the backend WebSocket opens, you can optionally send a subscription/message
  backendWs.on('open', () => {
    console.log('Connected to the backend WebSocket server.');

    // Example: If you need to send an initial message to the backend
    // backendWs.send(JSON.stringify({ type: 'subscribe', channel: 'someChannel' }));
  });

  // 3. Forward any messages from the backend to the connected Socket.IO client
  backendWs.on('message', (data) => {
    // You could parse it or just forward the raw data
    const message = data.toString();
    socket.emit('backendData', message);
  });

  // 4. Handle potential WebSocket errors
  backendWs.on('error', (err) => {
    console.error('Backend WebSocket error:', err);
  });

  // 5. When the backend closes, let’s log it
  backendWs.on('close', () => {
    console.log('Backend WebSocket connection closed.');
  });

  // 6. Receive messages from the front-end client and forward to the backend
  socket.on('clientToBackend', (msg) => {
    // For example, if the client sends a JSON string
    backendWs.send(msg);
  });

  // 7. Clean up connections if the Socket.IO client disconnects
  socket.on('disconnect', () => {
    console.log('Socket.IO client disconnected.');
    backendWs.close();
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
