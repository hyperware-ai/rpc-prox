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

const getUserConnectionsStatus = async (req, res) => {
    try {
        const cache = req.app.get('cache');
        const userConnections = cache.get("userConnections");
        console.log(Object.fromEntries(userConnections));

        if (req.path.includes('reset')) cache.set('userConnections', new Map());

        return res.status(200).json(Object.fromEntries(userConnections));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
}

module.exports = { setRestrictedProxy, getRestrictedProxyStatus, getUserConnectionsStatus };