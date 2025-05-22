const express = require('express');
const mongoose = require('mongoose');

const bookRoutes = require('./routes/book.routes');

mongoose.connect('mongodb+srv://julowebdev:QWDszaJfUnhNZ4RD@cluster0.smxhaj1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', // Adresse de la MongoDB à changer
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(express.json());

app.use('/api/book', bookRoutes);

module.exports = app;