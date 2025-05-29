const jwt = require('jsonwebtoken');

// Checks the user is logged in and its session is valid
module.exports = (req, res, next) => {
    try {
        // The authentication token is retrieved from the request header
        const token = req.headers.authorization.split(' ')[1];
        // The token is verified and decoded using the secret key
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // extracts the user ID and add it to the "auth" object attached to the request
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
    next();
    } catch(error) {
        res.status(401).json({ error });
    }
}