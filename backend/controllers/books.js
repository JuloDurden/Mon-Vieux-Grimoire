// Import Book model and fs module for file management
const Book = require('../models/book');
const fs = require('fs');

// Controller to create a new book
exports.createBook = (req, res, next) => {
  // Parse book object from FormData (sent as string)
  const bookObject = JSON.parse(req.body.book);
  
  // Remove sensitive fields to prevent client-side manipulation
  delete bookObject._id;
  delete bookObject._userId;
  
  // Create new Book instance with received data
  const book = new Book({
    ...bookObject,
    // Assign user ID from verified JWT token
    userId: req.auth.userId,
    // Build complete URL for optimized image (WebP)
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  
  // Save book to database
  book.save()
    .then(() => res.status(201).json({ message: 'Votre livre est enregistré'}))
    .catch(error => res.status(400).json({ error }));
};

// Controller to modify an existing book
exports.modifyBook = (req, res, next) => {
   // If file uploaded: parse JSON + new imageUrl, else: use request body directly
   const bookObject = req.file ? {
       ...JSON.parse(req.body.book),
       // Generate new image URL (optimized WebP file)
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   } : { ...req.body };
 
   // Remove _userId field to prevent manipulation
   delete bookObject._userId;
   
   // Check if book exists and belongs to user
   Book.findOne({_id: req.params.id})
       .then((book) => {
           // Authorization check: only owner can modify
           if (book.userId != req.auth.userId) {
               res.status(401).json({ message : 'Non autorisé'});
           } else {
               // Update book with new data
               Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
               .then(() => res.status(200).json({message : 'Votre livre a été modifié'}))
               .catch(error => res.status(401).json({ error }));
           }
       })
       .catch((error) => {
           res.status(400).json({ error });
       });
};

// Controller to delete a book
exports.deleteBook = (req, res, next) => {
  // Find book to delete
  Book.findOne({ _id: req.params.id})
    .then(book => {
      // Check permissions: only owner can delete
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non autorisé !' });
      } else {
        // Extract filename from image URL
        const filename = book.imageUrl.split('/images/')[1];
        
        // Physically remove image file from server
        fs.unlink(`images/${filename}`, () => {
          // Remove book from database
          Book.deleteOne({_id: req.params.id})
            .then(() => { res.status(200).json({ message: 'Livre supprimé !' })})
            .catch(error => res.status(401).json({ error }));
        })
      }
    })
    .catch( error => {
      res.status(500).json({ error });
    });
};

// Controller to get a specific book by ID
exports.getOneBook = (req, res, next) => {
  // Find book by ID from URL parameters
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

// Controller to get all books
exports.getAllBooks = (req, res, next) => {
  // Retrieve all books without filter
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};
