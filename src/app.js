require('dotenv').config();
const express = require('express');
const NodeCache = require("node-cache");
const cache = new NodeCache();
const app = express();
const routes = require('./routes.js');

cache.set('restrictedProxy', false);
app.use(routes);
app.set('trust proxy', true);

module.exports = { app, cache };