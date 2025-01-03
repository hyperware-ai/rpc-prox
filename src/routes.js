const { Router } = require('express');
const routes = Router();

routes.get('/default', (req, res) => {return res.status(200).json({ message: 'default route' })});

module.exports = routes;