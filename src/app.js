require('dotenv').config();
const express = require('express');
const app = express();
// const routes = require('./routes.js');

app.get('/default', (req, res) => {
    res.send('Hello from Express! This is also a WebSocket proxy.');
  });

// app.use(routes);

module.exports = app;