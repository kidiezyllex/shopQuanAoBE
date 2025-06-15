import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    
    'application/json',
    'text/markdown'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ. Vui lòng sử dụng file hợp lệ.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dung lượng file vượt quá giới hạn cho phép (50MB)'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

export default upload; 