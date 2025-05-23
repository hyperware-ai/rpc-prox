require('dotenv').config();
const shell = require('shelljs');

// For timestamped logs
function tsLog(...args) {
    console.log(`[${new Date().toISOString()}]`, ...args);
}
function tsError(...args) {
    console.error(`[${new Date().toISOString()}]`, ...args);
}

const setRestrictedProxy = async (req, res) => {
    try {
        const { restrictedProxy } = req.body;
        if (restrictedProxy === undefined) {
            return res.status(400).json({ message: "Missing body param(s), need restrictedProxy" });
        }
        if (restrictedProxy !== true && restrictedProxy !== false) {
            return res.status(400).json({ message: "restrictedProxy must be either true or false" });
        }
        const cache = req.app.get('cache');
        cache.set("restrictedProxy", restrictedProxy);
        console.log(`restrictedProxy set to ${restrictedProxy}`);

        return res.status(200).json({ restrictedProxy });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const getRestrictedProxyStatus = async (req, res) => {
    try {
        const cache = req.app.get('cache');
        const currentValue = cache.get("restrictedProxy");
        console.log({ restrictedProxy: currentValue });

        return res.status(200).json({ restrictedProxy: currentValue });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const addToWhitelist = async (req, res) => {
    try {
        const { shortcode } = req.params;
        if (shortcode === undefined) {
            return res.status(400).json({ message: "Missing path param, need :shortcode" });
        }
        const { whitelistEntry, whitelistKey } = req.body;
        if (whitelistEntry === undefined || whitelistKey === undefined || whitelistEntry === "" || whitelistKey === "") {
            return res.status(400).json({ message: "Missing body param(s), need whitelistEntry and whitelistKey" });
        }
        const cache = req.app.get('cache');
        //cache.set("restrictedProxy", restrictedProxy);
        //console.log(`restrictedProxy set to ${restrictedProxy}`);
        if (!cache.has(`${shortcode}-whitelist`)) {
            tsLog(`No whitelist cache for client shortcode: "${shortcode}", creating it`);
            cache.set(`${shortcode}-whitelist`, new Map());
        }
        const whitelist = cache.get(`${shortcode}-whitelist`);
        if (whitelist.has(whitelistEntry)) {
            whitelist.set(whitelistEntry, whitelistKey);
            tsLog(`node: ${whitelistEntry} updated whitelist entry to ${whitelistKey}`);
        } else {
            whitelist.set(whitelistEntry, whitelistKey);
            tsLog(`Added new ${whitelistEntry}-whitelist entry of ${whitelistKey} for node: ${whitelistEntry}`);
        }
        cache.set(`${shortcode}-whitelist`, whitelist);

        return res.status(200).json(Object.fromEntries(whitelist));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const removeFromWhitelist = async (req, res) => {
    try {
        const { shortcode } = req.params;
        if (shortcode === undefined) {
            return res.status(400).json({ message: "Missing path param, need :shortcode" });
        }
        const { whitelistEntry } = req.body;
        if (whitelistEntry === undefined) {
            return res.status(400).json({ message: "Missing body param, need whitelistEntry" });
        }
        const cache = req.app.get('cache');
        //cache.set("restrictedProxy", restrictedProxy);
        //console.log(`restrictedProxy set to ${restrictedProxy}`);
        if (!cache.has(`${shortcode}-whitelist`)) {
            tsLog(`No whitelist cache for client shortcode: ${shortcode}`);
            return res.status(400).json({ message: `No whitelist cache for client shortcode: ${shortcode}` });
        }
        const whitelist = cache.get(`${shortcode}-whitelist`);
        if (whitelist.has(whitelistEntry)) {
            whitelist.delete(whitelistEntry);
            tsLog(`node: ${whitelistEntry} deleted whitelist entry`);
        } else {
            whitelist.set(whitelistEntry, 1);
            tsLog(`No ${whitelistEntry}-whitelist entry for node: ${whitelistEntry}`);
            return res.status(400).json({ message: `No ${whitelistEntry}-whitelist entry for node: ${whitelistEntry}` });            
        }
        cache.set(`${shortcode}-whitelist`, whitelist);

        return res.status(200).json({ message: `node: ${whitelistEntry} deleted whitelist entry`});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const getWhitelist = async (req, res) => {
    try {
        const { shortcode } = req.params;
        const cache = req.app.get('cache');
        if (!cache.has(`${shortcode}-whitelist`)) {
            return res.status(404).json({ message: `No ${shortcode}-whitelist cache exists` });
        }
        const whitelistEntries = cache.get(`${shortcode}-whitelist`);
        //console.log(Object.fromEntries(whitelistEntries));

        if (req.path.includes('reset')) cache.set(`${shortcode}-whitelist`, new Map());

        return res.status(200).json(Object.fromEntries(whitelistEntries));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const getUserConnectionsStatus = async (req, res) => {
    try {
        const { shortcode } = req.params;
        const cache = req.app.get('cache');
        if (!cache.has(`${shortcode}-userConnections`)) {
            return res.status(404).json({ message: `No ${shortcode}-userConnections cache exists` });
        }
        const userConnections = cache.get(`${shortcode}-userConnections`);
        console.log(Object.fromEntries(userConnections));

        if (req.path.includes('reset')) cache.set(`${shortcode}-userConnections`, new Map());

        return res.status(200).json(Object.fromEntries(userConnections));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const triggerReboot = async (req, res) => {
    try {
        return res.status(200).json({ message: "reboot underway" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "error in controller" });
    }
}

const prepopulateWhitelist = async (req, res) => {
    try {
        shortcodeArray = JSON.parse(process.env.ASSOCIATED_SHORTCODES)
        const cache = req.app.get('cache');
        for (let i = 0; i < shortcodeArray.length; i++) {
            console.log(shortcodeArray[i])
            cache.set(`${shortcodeArray[i]}-whitelist`, new Map());
            const whitelist = cache.get(`${shortcodeArray[i]}-whitelist`);
            const whitelistedNodes = await shell.exec(`curl ${process.env.BACKEND_URL}/get-ship-tokens/${shortcodeArray[i]}`, { silent: true });
            const nodeArray = JSON.parse(whitelistedNodes.stdout)
            for (let j = 0; j < nodeArray.length; j++) {
                console.log(nodeArray[j].node)
                if (nodeArray[j].rpc_token === null) {
                    console.log("allowed");
                    whitelist.set(nodeArray[j].node, "allowed");
                } else {
                    console.log(nodeArray[j].rpc_token)
                    whitelist.set(nodeArray[j].node, nodeArray[j].rpc_token);
                }
            }
            cache.set(`${shortcodeArray[i]}-whitelist`, whitelist);
        }
        return res.status(200).json({ message: "prepopulation complete" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "error in controller" });
    }
}

module.exports = { setRestrictedProxy, 
    getRestrictedProxyStatus,
    prepopulateWhitelist, 
    addToWhitelist,
    removeFromWhitelist,
    getWhitelist,
    getUserConnectionsStatus, 
    triggerReboot };