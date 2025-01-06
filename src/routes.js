const { Router } = require('express');
const routes = Router();

const proxyManagementController = require('./controllers/proxyManagementController');

routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

routes.post('/toggle-restricted-proxy', proxyManagementController.toggleRestrictedProxy);
routes.get('/restricted-proxy-status', proxyManagementController.getRestrictedProxyStatus);

module.exports = routes;