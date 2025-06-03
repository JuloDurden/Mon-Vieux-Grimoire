require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/book.routes');
const authRoutes = require('./routes/auth.routes');
const path = require('path');

// Connexion à la DB MongoDB
mongoose.connect(process.env.MONGODB_URI,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// Configuration manuelle des headers CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Routes pour les livres et les utilisateurs
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);

// Configuration du serveur d'images
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;