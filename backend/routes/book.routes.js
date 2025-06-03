const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/books')

// Route pour avoir le classement (⚠️ doit être placé AVANT la route /:id)
router.get('/bestrating', bookCtrl.getBestRating);

router.get('/', bookCtrl.getAllBooks);
router.post('/', auth, multer, bookCtrl.createBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

// Route pour noter un livre
router.post('/:id/rating', auth, bookCtrl.rateBook);

module.exports = router;