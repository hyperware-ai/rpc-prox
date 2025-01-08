/*
* Only permits requests from localhost 
*/

const localonly = (req, res, next) => {
    if (req.hostname !== 'localhost') {
        return res.status(401).send({ message: 'Only local requests permitted' });
    } else {
        return next();
    }
}
module.exports = localonly;