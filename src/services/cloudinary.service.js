import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: 'drqbhj6ft',
  api_key: '191952193821284',
  api_secret: '23tR5d5GDWA6hycDzydv6zs_HNU'
});

/**
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} folderPath 
 * @param {string} resourceType 
 * @returns {Promise<Object>} 
 */
export const uploadFileToCloudinary = async (
  fileBuffer,
  fileName,
  folderPath,
  resourceType = 'auto'
) => {
  try {
    const publicId = `${folderPath}/${fileName.split('.')[0]}`;
        
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: publicId,
          folder: folderPath,
          overwrite: true,
          use_filename: true,
          unique_filename: false
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            format: result.format,
            resourceType: result.resource_type,
            size: result.bytes,
            path: result.public_id,
            fullPath: result.public_id
          });
        }
      );
      
      bufferStream.pipe(uploadStream);
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa file từ Cloudinary
 * @param {string} publicId - Public ID của file cần xóa
 * @param {string} resourceType - Loại tài nguyên (image, video, raw)
 * @returns {Promise<Object>} Kết quả xóa
 */
export const deleteFileFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    return { 
      success: result === 'ok',
      result
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo URL ký cho việc download file từ Cloudinary
 * @param {string} publicId - Public ID của file
 * @param {number} expiresAt - Thời gian hết hạn của URL (mặc định: 1 giờ)
 * @returns {string} Signed URL
 */
export const getSignedUrl = (publicId, expiresAt = Math.floor(Date.now() / 1000) + 3600) => {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    expires_at: expiresAt
  });
};

export default cloudinary; 