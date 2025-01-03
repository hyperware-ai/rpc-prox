const { Router } = require('express');
const routes = Router();

routes.get('/', (req, res) => {res.json({ message: 'invalid route' })});

module.exports = routes;