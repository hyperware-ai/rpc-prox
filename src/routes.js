const { Router } = require('express');
const routes = Router();

routes.get('/', (req, res) => {res.status(200).json({ message: 'default route' })});

module.exports = routes;