const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [{
    userId: { type: String, required: true },
    grade: { 
      type: Number,
      min: 0,
      max: 5,
      required: false }
  }],
  averageRating: { 
    type: Number,
    default: 0,
    required: false }
});

module.exports = mongoose.model('Book', bookSchema);
