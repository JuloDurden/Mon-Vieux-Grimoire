const jwt = require('jsonwebtoken');

// Vérifie que l'utilisateur est connecté et que sa session est valide
module.exports = (req, res, next) => {
    try {
        // Le token d'authentification est extrait de l'en-tête de requête
        const token = req.headers.authorization.split(' ')[1];
        // Le token est vérifié et décodé à l'aide de la clé secrète.
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Identifiant de l'utilisateur extrait et ajouté à l'objet "auth" attaché à la requête
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
    next();
    } catch(error) {
        res.status(401).json({ error });
    }
}