const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// MIME types supported for conversion
// Used only to generate file extensions
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg', 
    'image/png': 'png',
    'image/webp': 'webp'
};

// Configuring temporary memory storage
// Files are not yet saved to disk
const storage = multer.memoryStorage();

// Multer's basic configuration - accepts all file types
const upload = multer({ 
    storage: storage
}).single('image');

// Customised middleware to process the image after upload
const processImage = async (req, res, next) => {
    // If no file is uploaded, go to the following middleware
    if (!req.file) {
        return next();
    }

    try {
        // Generate a unique file name
        const name = req.file.originalname.split(' ').join('_').split('.')[0];
        const filename = name + '_' + Date.now() + '.webp';
        
        // Destination path for the optimised file
        const outputPath = path.join('images', filename);

        // Image processing with Sharp :
        await sharp(req.file.buffer)
            .resize(800, 1000, { 
                fit: 'inside',      // Keep the proportions
                withoutEnlargement: true // Does not enlarge small images
            })
            .webp({ // Conversion to WebP with 80% compression
                quality: 80,
                effort: 6,
                smartSubsample: false, // Best colour quality
                reductionEffort: 6     // More effort to reduce
            })
            .toFile(outputPath);    // Backup to disk

        // Update file information for the following middlewares
        req.file.filename = filename;
        req.file.path = outputPath;
        
        console.log(`✅ Image optimisée et sauvegardée : ${filename}`);
        next();

    } catch (error) {
        // If Sharp cannot process the file (wrong format), 
        // the error will be handled silently on the server side
        console.error('❌ Erreur lors du traitement de l\'image :', error);
        next(error);
    }
};

// Exporting combined middleware: upload + processing
module.exports = (req, res, next) => {
    // First run the Multer upload
    upload(req, res, (error) => {
        if (error) {
            return next(error);
        }
        // Then process the image
        processImage(req, res, next);
    });
};
