/**
 * Multer Configuration for Image Upload
 * Memory storage for uploading to R2
 */

const multer = require('multer');

// Use memory storage (files stored in memory as Buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WEBP'), false);
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files
  }
});

module.exports = upload;
