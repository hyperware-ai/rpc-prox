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
routes.get('/monitor/restricted-proxy-status', localonly, proxyManagementController.getRestrictedProxyStatus);
routes.post('/monitor/prepopulate-whitelist', localonly, proxyManagementController.prepopulateWhitelist);

routes.post('/add-to-whitelist/:shortcode', middlewareSecret, proxyManagementController.addToWhitelist);
routes.post('/monitor/add-to-whitelist/:shortcode', localonly, proxyManagementController.addToWhitelist);
routes.delete('/remove-from-whitelist/:shortcode', middlewareSecret, proxyManagementController.removeFromWhitelist);
routes.delete('/monitor/remove-from-whitelist/:shortcode', localonly, proxyManagementController.removeFromWhitelist);
routes.get('/monitor/get-whitelist/:shortcode', localonly, proxyManagementController.getWhitelist);
routes.get('/monitor/reset-whitelist/:shortcode', localonly, proxyManagementController.getWhitelist);

routes.get('/user-connections/:shortcode', middlewareSecret, proxyManagementController.getUserConnectionsStatus);
routes.put('/user-connections-with-reset/:shortcode', middlewareSecret, proxyManagementController.getUserConnectionsStatus);

//routes.post('/add-proxy-user', middlewareSecret, proxyManagementController.addProxyUser);
// {"screenname":"k12345k","secret":"sEcReT"}
// 200 means it's good, 500 can't add user
//routes.delete('/delete-proxy-user/:screenname', middlewareSecret, proxyManagementController.deleteProxyUser);
// no payload
// 200 means it's good, 500 can't delete user
//routes.put('/update-proxy-user/:screenname', middlewareSecret, proxyManagementController.updateProxyUser);
// {"secret":"sEcReT"}
// 200 means it's good, 500 can't update user


routes.put('/limited/trigger-reboot', proxyManagementController.triggerReboot);

module.exports = routes;