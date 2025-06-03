const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Types MIME pris en charge pour la conversion
// Utilisés uniquement pour générer les extensions de fichiers
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg', 
    'image/png': 'png',
    'image/webp': 'webp'
};

// Configuration du stockage temporaire
// Les fichiers ne sont pas encore enregistrés sur le disque
const storage = multer.memoryStorage();

// Configuration de base de Multer - accepte tous les types de fichiers
const upload = multer({ 
    storage: storage
}).single('image');

// Middleware personnalisé pour traiter l'image après le d/L
const processImage = async (req, res, next) => {
    // Si aucun fichier n'est d/L, passez au middleware suivant
    if (!req.file) {
        return next();
    }

    try {
        // Générer un nom de fichier unique
        const name = req.file.originalname.split(' ').join('_').split('.')[0];
        const filename = name + '_' + Date.now() + '.webp';
        
        // Chemin de destination du fichier optimisé
        const outputPath = path.join('images', filename);

        // Traitement d'images avec Sharp :
        await sharp(req.file.buffer)
            .resize(800, 1000, { 
                fit: 'inside',      // On garde les proportions
                withoutEnlargement: true // On n'agrandit pas les petites images
            })
            .webp({ // Conversion en WebP avec une compression de 80%
                quality: 80,
                effort: 6,
                smartSubsample: false, // Meilleure qualité des couleurs
                reductionEffort: 6     // Plus d'efforts de réduction
            })
            .toFile(outputPath);    // Sauvegarde dans le dossier images

        // MAJ des informations du fichier pour les prochains middlewares
        req.file.filename = filename;
        req.file.path = outputPath;
        
        console.log(`✅ Image optimisée et sauvegardée : ${filename}`);
        next();

    } catch (error) {
        console.error('❌ Erreur lors du traitement de l\'image :', error);
        next(error);
    }
};

// Middleware combiné : upload + processing
module.exports = (req, res, next) => {
    // D'abord l'upload Multer
    upload(req, res, (error) => {
        if (error) {
            return next(error);
        }
        // Puis traitement de l'image
        processImage(req, res, next);
    });
};
