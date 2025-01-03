const { Router } = require('express');
const routes = Router();

routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

module.exports = routes;