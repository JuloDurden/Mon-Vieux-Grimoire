const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth')

const bookCtrl = require('../controllers/books')

router.post('/', auth, bookCtrl.createBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/', bookCtrl.getAllBooks);

module.exports = router;