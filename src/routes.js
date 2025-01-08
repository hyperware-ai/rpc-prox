const { Router } = require('express');
const routes = Router();

// Controllers
const proxyManagementController = require('./controllers/proxyManagementController');

// Middleware
const localonly = require('./middlewares/localonly');

// Routes
routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

routes.post('/monitor/set-restricted-proxy', localonly, proxyManagementController.setRestrictedProxy);
routes.get('/restricted-proxy-status', proxyManagementController.getRestrictedProxyStatus);
routes.get('/user-connections', proxyManagementController.getUserConnectionsStatus);
routes.put('/user-connections-with-reset', proxyManagementController.getUserConnectionsStatus);

module.exports = routes;