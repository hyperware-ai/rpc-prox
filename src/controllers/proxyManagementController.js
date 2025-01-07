const toggleRestrictedProxy = async (req, res) => {
    try {
        const cache = req.app.get('cache');
        let currentValue = cache.get("restrictedProxy");
        if (currentValue === undefined) {
            currentValue = false;
            cache.set("restrictedProxy", currentValue);
        }

        const newValue = !currentValue;
        cache.set("restrictedProxy", newValue);
        console.log({ success: true, restrictedProxy: newValue });

        return res.status(200).json({ success: true, restrictedProxy: newValue });
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

const getUserConnectionsStatus = async (req, res) => {
    try {
        const cache = req.app.get('cache');
        const userConnections = cache.get("userConnections");
        console.log(userConnections);

        return res.status(200).json({ userConnections });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

module.exports = { toggleRestrictedProxy, getRestrictedProxyStatus, getUserConnectionsStatus };