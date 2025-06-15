import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import upload, { handleUploadError } from '../middlewares/upload.middleware.js';
import { uploadImage } from '../controllers/upload.controller.js';

const router = express.Router();

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload ảnh lên Cloudinary
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: File ảnh cần upload
 *     responses:
 *       201:
 *         description: Ảnh đã được upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tải ảnh lên thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: https://res.cloudinary.com/example/image/upload/example.jpg
 *                     publicId:
 *                       type: string
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       500:
 *         description: Lỗi server
 */
router.post('/image', protect, upload.single('file'), handleUploadError, uploadImage);

export default router; 