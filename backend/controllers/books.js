// Import du modèle Book et du module fs pour la gestion des fichiers
const Book = require('../models/book');
const fs = require('fs');

/**
 * CRÉER UN NOUVEAU LIVRE
 * Gère la création d'un livre avec ou sans note initiale
 */
exports.createBook = (req, res, next) => {
  // Parse les données du livre depuis la requête multipart (avec image)
  const bookObject = JSON.parse(req.body.book);

  // Supprime les champs sensibles/invalides envoyés par le frontend
  delete bookObject._id;
  delete bookObject._userId;

  // Gestion intelligente des notes lors de la création
  let finalRatings = [];
  let finalAverageRating = 0;

  // Si l'utilisateur a donné une vraie note (> 0), on la conserve
  if (bookObject.ratings && bookObject.ratings[0] && bookObject.ratings[0].grade > 0) {
    finalRatings = bookObject.ratings;
    finalAverageRating = bookObject.averageRating;
  } else {
    // Sinon, livre créé sans notation (ratings vide pour permettre notation ultérieure)
    finalRatings = [];
    finalAverageRating = 0;
  }

  // Création de l'objet Book avec les bonnes données
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: req.file 
      ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      : bookObject.imageUrl,
    ratings: finalRatings,
    averageRating: finalAverageRating
  });

  // Sauvegarde en base de données
  book.save()
    .then(() => { res.status(201).json({ message: 'Objet enregistré !' }); })
    .catch(error => { res.status(400).json({ error }); });
};

/**
 * MODIFIER UN LIVRE EXISTANT
 * Permet de modifier les infos d'un livre (titre, auteur, etc.) sans toucher aux notes
 * Gère la suppression de l'ancienne image si une nouvelle est uploadée
 */
exports.modifyBook = (req, res, next) => {
  // Gestion des données avec ou sans nouvelle image
  const bookObject = req.file 
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } 
    : { ...req.body };

  // Supprime le champ sensible
  delete bookObject._userId;

  // Recherche du livre à modifier
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Vérification des droits : seul le propriétaire peut modifier
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        
        // 🗑️ SUPPRESSION DE L'ANCIENNE IMAGE SI NOUVELLE IMAGE UPLOADÉE
        if (req.file && book.imageUrl) {
          const oldImageName = book.imageUrl.split('/images/')[1];
          const oldImagePath = `images/${oldImageName}`;
          
          fs.unlink(oldImagePath, (error) => {
            if (error) {
              console.log('⚠️ Erreur suppression ancienne image :', error.message);
            } else {
              console.log(`🗑️ Ancienne image supprimée : ${oldImageName}`);
            }
          });
        }

        // Préparation des données à mettre à jour
        // IMPORTANT : conserve les ratings existants si pas fournis dans la modification
        const updateData = {
          ...bookObject,
          ratings: bookObject.ratings || book.ratings,
          averageRating: bookObject.averageRating !== undefined 
            ? bookObject.averageRating 
            : book.averageRating
        };

        // Mise à jour en base de données
        Book.updateOne({ _id: req.params.id }, updateData)
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch(error => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

/**
 * SUPPRIMER UN LIVRE
 * Supprime le livre et son image du serveur
 */
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
    .then(book => {
      // Vérification des droits : seul le propriétaire peut supprimer
      if (book.userId != req.auth.userId) {
        res.status(401).json({message: 'Non autorisé'});
      } else {
        // Extraction du nom du fichier image pour suppression
        const filename = book.imageUrl.split('/images/')[1];
        
        // Suppression du fichier image du serveur
        fs.unlink(`images/${filename}`, () => {
          // Suppression du livre de la base de données
          Book.deleteOne({_id: req.params.id})
            .then(() => { res.status(200).json({ message: 'Livre supprimé !' })})
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch( error => {
      res.status(500).json({ error });
    });
};

/**
 * RÉCUPÉRER UN LIVRE SPÉCIFIQUE
 * Retourne les détails d'un livre par son ID
 */
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

/**
 * RÉCUPÉRER TOUS LES LIVRES
 * Retourne la liste complète des livres
 */
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};

/**
 * NOTER UN LIVRE
 * Permet d'ajouter une note à un livre (une seule fois par utilisateur)
 */
exports.rateBook = (req, res, next) => {
  const { rating } = req.body;
  
  // Validation : la note doit être entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5' });
  }
  
  Book.findOne({ _id: req.params.id })
    .then(book => {
      // Vérification que le livre existe
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }
      
      // Vérification si l'utilisateur a déjà noté ce livre
      const existingRatingIndex = book.ratings.findIndex(r => r.userId === req.auth.userId);
      
      if (existingRatingIndex !== -1) {
        // Empêche la double notation
        return res.status(400).json({ 
          message: 'Vous avez déjà noté ce livre' 
        });
      } else {
        // Ajout de la nouvelle note
        book.ratings.push({ 
          userId: req.auth.userId, 
          grade: rating 
        });
      }
      
      // Recalcul de la moyenne de toutes les notes
      if (book.ratings.length > 0) {
        const totalRating = book.ratings.reduce((sum, r) => sum + r.grade, 0);
        book.averageRating = Math.round((totalRating / book.ratings.length) * 100) / 100;
      } else {
        book.averageRating = null;
      }
      
      // Sauvegarde des modifications
      return book.save();
    })
    .then(updatedBook => {
      res.status(200).json(updatedBook);
    })
    .catch(error => {
      res.status(400).json({ error });
    });
};

/**
 * RÉCUPÉRER LE TOP 3 DES LIVRES LES MIEUX NOTÉS
 * Retourne les 3 livres avec la meilleure moyenne
 */
exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })  // Tri décroissant par moyenne
    .limit(3)                     // Limite à 3 résultats
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};