import { uploadFileToCloudinary } from '../services/cloudinary.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @desc    Upload ảnh lên Cloudinary
 * @route   POST /upload/image
 * @access  Private
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có ảnh nào được cung cấp'
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'File không phải là ảnh'
      });
    }

    const originalName = req.file.originalname;
    const fileExtension = originalName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const folderPath = `shopquanao/${req.account.id}/images`;

    const imageData = await uploadFileToCloudinary(
      req.file.buffer,
      uniqueFileName,
      folderPath,
      'image'
    );

    res.status(201).json({
      success: true,
      message: 'Tải ảnh lên thành công',
      data: {
        imageUrl: imageData.url,
        publicId: imageData.publicId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải ảnh lên'
    });
  }
}; 