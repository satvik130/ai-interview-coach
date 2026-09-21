import multer from 'multer';

// In-memory buffer storage (avoids writing temp files to disk)
const storage = multer.memoryStorage();

// File filter to restrict uploads strictly to PDF documents
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const hasPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime || hasPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF documents are supported'), false);
  }
};

// 5MB file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
  fileFilter,
});

export default upload;
