import express from 'express';
import {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  getProductPromotions
} from '../controllers/promotion.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /promotions:
 *   post:
 *     summary: Tạo chương trình khuyến mãi mới
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discountPercent
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo chương trình khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createPromotion);

/**
 * @swagger
 * /promotions:
 *   get:
 *     summary: Lấy danh sách chương trình khuyến mãi (Public)
 *     tags: [Promotions]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách khuyến mãi thành công
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', getPromotions);

/**
 * @swagger
 * /promotions/{id}:
 *   get:
 *     summary: Lấy chi tiết chương trình khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin khuyến mãi thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getPromotionById);

/**
 * @swagger
 * /promotions/{id}:
 *   put:
 *     summary: Cập nhật chương trình khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discountPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *     responses:
 *       200:
 *         description: Cập nhật khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updatePromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   delete:
 *     summary: Xóa chương trình khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa khuyến mãi thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deletePromotion);

/**
 * @swagger
 * /promotions/product/{productId}:
 *   get:
 *     summary: Lấy danh sách khuyến mãi đang áp dụng cho sản phẩm
 *     tags: [Promotions]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy danh sách khuyến mãi thành công
 *       400:
 *         description: ID sản phẩm không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/product/:productId', getProductPromotions);

export default router; 