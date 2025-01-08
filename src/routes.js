const { Router } = require('express');
const routes = Router();

// Controllers
const proxyManagementController = require('./controllers/proxyManagementController');

// Middleware
const localonly = require('./middlewares/localonly');

// Routes
routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

routes.post('/set-restricted-proxy', localonly, proxyManagementController.setRestrictedProxy);
routes.get('/restricted-proxy-status', proxyManagementController.getRestrictedProxyStatus);
routes.get('/user-connections', proxyManagementController.getUserConnectionsStatus);
routes.get('/clear-user-connections', proxyManagementController.getUserConnectionsStatus);

module.exports = routes;