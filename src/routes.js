const { Router } = require('express');
const routes = Router();

const proxyManagementController = require('./controllers/proxyManagementController');

routes.get('/default', (req, res) => {return res.status(200).json({ message: 'Router route' })});

routes.post('/set-restricted-proxy', proxyManagementController.setRestrictedProxy);
routes.get('/restricted-proxy-status', proxyManagementController.getRestrictedProxyStatus);
routes.get('/user-connections', proxyManagementController.getUserConnectionsStatus);
routes.get('/clear-user-connections', proxyManagementController.getUserConnectionsStatus);

module.exports = routes;