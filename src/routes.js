const { Router } = require('express');
const routes = Router();

// Controllers
const proxyManagementController = require('./controllers/proxyManagementController');

// Middleware
const localonly = require('./middlewares/localonly');
const middlewareSecret = require('./middlewares/middlewareSecret');

// Routes
routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

routes.post('/monitor/set-restricted-proxy', localonly, proxyManagementController.setRestrictedProxy);
routes.get('/restricted-proxy-status', middlewareSecret, proxyManagementController.getRestrictedProxyStatus);
routes.get('/user-connections', middlewareSecret, proxyManagementController.getUserConnectionsStatus);
routes.put('/user-connections-with-reset', middlewareSecret, proxyManagementController.getUserConnectionsStatus);

module.exports = routes;