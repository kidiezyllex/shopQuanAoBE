import express from 'express';
import {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  sendNotification,
  getUserNotifications,
  sendNotificationToAllCustomers
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Tạo thông báo mới
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *               - relatedTo
 *               - relatedId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [EMAIL, SYSTEM]
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               relatedTo:
 *                 type: string
 *                 enum: [VOUCHER, ORDER, PROMOTION, SYSTEM]
 *               relatedId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thông báo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createNotification);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Lấy danh sách thông báo
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [EMAIL, SYSTEM]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, FAILED]
 *       - in: query
 *         name: relatedTo
 *         schema:
 *           type: string
 *           enum: [VOUCHER, ORDER, PROMOTION, SYSTEM]
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
 *         description: Lấy danh sách thông báo thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getNotifications);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Lấy chi tiết thông báo
 *     tags: [Notifications]
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
 *         description: Lấy thông tin thông báo thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thông báo
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getNotificationById);

/**
 * @swagger
 * /notifications/{id}:
 *   put:
 *     summary: Cập nhật thông báo
 *     tags: [Notifications]
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [PENDING, SENT, FAILED]
 *     responses:
 *       200:
 *         description: Cập nhật thông báo thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thông báo
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Xóa thông báo
 *     tags: [Notifications]
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
 *         description: Xóa thông báo thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thông báo
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteNotification);

/**
 * @swagger
 * /notifications/{id}/send:
 *   post:
 *     summary: Gửi thông báo
 *     tags: [Notifications]
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
 *         description: Gửi thông báo thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thông báo
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/:id/send', authenticate, authorizeAdmin, sendNotification);

/**
 * @swagger
 * /notifications/user:
 *   get:
 *     summary: Lấy thông báo của người dùng đăng nhập
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Lấy danh sách thông báo thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/user', authenticate, getUserNotifications);

/**
 * @swagger
 * /notifications/send-all:
 *   post:
 *     summary: Gửi thông báo đến tất cả khách hàng
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *               - relatedTo
 *               - relatedId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [EMAIL, SYSTEM]
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               relatedTo:
 *                 type: string
 *                 enum: [VOUCHER, ORDER, PROMOTION, SYSTEM]
 *               relatedId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thông báo cho tất cả khách hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/send-all', authenticate, authorizeAdmin, sendNotificationToAllCustomers);

export default router; 