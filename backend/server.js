const http = require('http');

const server = http.createServer((req, res) => {
    res.end('Voilà la réponse du serveur de Mon Vieux Grimoire !');
});

server.listen(4000, () => {
    console.log('Serveur en écoute sur le port 4000');
});
