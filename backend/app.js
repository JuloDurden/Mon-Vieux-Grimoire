require('dotenv').config();
const express = require('express');
// const cors = require('cors');
const mongoose = require('mongoose');
const bookRoutes = require('./routes/book.routes');
const authRoutes = require('./routes/auth.routes');
const path = require('path');

// Connecting to the MongoDB database
mongoose.connect(process.env.MONGODB_URI,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// Configuring CORS headers
// app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Routes for books and users
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);

// Image server configuration
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;