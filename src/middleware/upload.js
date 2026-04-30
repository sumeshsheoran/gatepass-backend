const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadsBase = process.env.UPLOADS_PATH
  ? path.resolve(process.env.UPLOADS_PATH)
  : path.join(__dirname, '../../uploads');

// ensure directories exist on startup
['photos', 'ids'].forEach(sub => {
  const dir = path.join(uploadsBase, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

module.exports.uploadsBase = uploadsBase;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'idProof'
      ? path.join(uploadsBase, 'ids')
      : path.join(uploadsBase, 'photos');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
  }
};

const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

module.exports = upload;
