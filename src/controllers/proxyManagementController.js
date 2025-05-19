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

const addToBlacklist = async (req, res) => {
    try {
        const { shortcode } = req.params;
        if (shortcode === undefined) {
            return res.status(400).json({ message: "Missing path param, need :shortcode" });
        }
        const { blacklistEntry } = req.body;
        if (blacklistEntry === undefined) {
            return res.status(400).json({ message: "Missing body param, need blacklistEntry" });
        }
        const cache = req.app.get('cache');
        //cache.set("restrictedProxy", restrictedProxy);
        //console.log(`restrictedProxy set to ${restrictedProxy}`);
        if (!cache.has(`${shortcode}-blacklist`)) {
            tsLog(`No blacklist cache for client shortcode: "${shortcode}", creating it`);
            cache.set(`${shortcode}-blacklist`, new Map());
        }
        const blacklist = cache.get(`${shortcode}-blacklist`);
        if (blacklist.has(blacklistEntry)) {
            blacklist.set(blacklistEntry, blacklist.get(blacklistEntry) + 1);
            tsLog(`node: ${blacklistEntry} updated blacklist entry to ${blacklist.get(blacklistEntry)}`);
        } else {
            blacklist.set(node, 1);
            tsLog(`Added new ${blacklistEntry}-blacklist entry for node: ${blacklistEntry}`);
        }
        cache.set(`${shortcode}-blacklist`, blacklist);

        return res.status(200).json({ "nothing":"nothing" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

const getBlacklist = async (req, res) => {
    try {
        const { shortcode } = req.params;
        const cache = req.app.get('cache');
        if (!cache.has(`${shortcode}-blacklist`)) {
            return res.status(404).json({ message: `No ${shortcode}-blacklist cache exists` });
        }
        const blacklistEntries = cache.get(`${shortcode}-blacklist`);
        console.log(Object.fromEntries(blacklistEntries));

        if (req.path.includes('reset')) cache.set(`${shortcode}-blacklist`, new Map());

        return res.status(200).json(Object.fromEntries(blacklistEntries));
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

module.exports = { setRestrictedProxy, 
    getRestrictedProxyStatus, 
    addToBlacklist,
    getBlacklist,
    getUserConnectionsStatus, 
    triggerReboot };