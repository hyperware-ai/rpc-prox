const middlewareSecret = (req, res, next)=>{
    if(req.headers.secret !== process.env.MIDDLEWARE_SECRET) {
      return res.status(401).send({message: 'Middleware secret key does not match'});
    } else {
      return next();
    }
}

module.exports = middlewareSecret;