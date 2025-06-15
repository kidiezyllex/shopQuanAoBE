import express from 'express';
import {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  updateReturn,
  deleteReturn,
  searchReturn,
  getReturnStats,
  getReturnableOrders,
  createReturnRequest,
  getMyReturns,
  getMyReturnById,
  cancelMyReturn
} from '../controllers/return.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin, authorizeCustomer } from '../middlewares/role.middleware.js';

const router = express.Router();

// ===== ROUTES CHO KHÁCH HÀNG =====

/**
 * @swagger
 * /returns/returnable-orders:
 *   get:
 *     summary: Khách hàng xem đơn hàng có thể trả (trong vòng 7 ngày)
 *     tags: [Returns - Customer]
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
 *         description: Lấy danh sách đơn hàng có thể trả thành công
 */
router.get('/returnable-orders', authenticate, authorizeCustomer, getReturnableOrders);

/**
 * @swagger
 * /returns/request:
 *   post:
 *     summary: Khách hàng yêu cầu trả hàng
 *     tags: [Returns - Customer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalOrder
 *               - items
 *               - reason
 *             properties:
 *               originalOrder:
 *                 type: string
 *                 description: ID của đơn hàng gốc
 *               items:
 *                 type: array
 *                 description: Danh sách sản phẩm cần trả
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID của sản phẩm
 *                     variant:
 *                       type: object
 *                       properties:
 *                         colorId:
 *                           type: string
 *                         sizeId:
 *                           type: string
 *                     quantity:
 *                       type: number
 *                       description: Số lượng sản phẩm trả
 *               reason:
 *                 type: string
 *                 description: Lý do trả hàng
 *     responses:
 *       201:
 *         description: Yêu cầu trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       403:
 *         description: Không có quyền trả hàng cho đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.post('/request', authenticate, authorizeCustomer, createReturnRequest);

/**
 * @swagger
 * /returns/my:
 *   get:
 *     summary: Khách hàng xem danh sách đơn trả hàng của mình
 *     tags: [Returns - Customer]
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
 *         description: Lấy danh sách đơn trả hàng thành công
 */
router.get('/my', authenticate, authorizeCustomer, getMyReturns);

/**
 * @swagger
 * /returns/my/{id}:
 *   get:
 *     summary: Khách hàng xem chi tiết đơn trả hàng của mình
 *     tags: [Returns - Customer]
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
 *         description: Lấy chi tiết đơn trả hàng thành công
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 */
router.get('/my/:id', authenticate, authorizeCustomer, getMyReturnById);

/**
 * @swagger
 * /returns/my/{id}/cancel:
 *   put:
 *     summary: Khách hàng hủy yêu cầu trả hàng
 *     tags: [Returns - Customer]
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
 *         description: Hủy yêu cầu trả hàng thành công
 *       400:
 *         description: Không thể hủy đơn trả hàng này
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 */
router.put('/my/:id/cancel', authenticate, authorizeCustomer, cancelMyReturn);

// ===== ROUTES CHO ADMIN =====

/**
 * @swagger
 * /returns:
 *   post:
 *     summary: Tạo đơn trả hàng mới
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalOrder
 *               - customer
 *               - items
 *               - totalRefund
 *             properties:
 *               originalOrder:
 *                 type: string
 *                 description: ID của đơn hàng gốc
 *               customer:
 *                 type: string
 *                 description: ID của khách hàng
 *               items:
 *                 type: array
 *                 description: Danh sách sản phẩm trả lại
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID của sản phẩm
 *                     variant:
 *                       type: object
 *                       properties:
 *                         colorId:
 *                           type: string
 *                           description: ID của màu sắc
 *                         sizeId:
 *                           type: string
 *                           description: ID của kích cỡ
 *                     quantity:
 *                       type: number
 *                       description: Số lượng sản phẩm trả
 *                     price:
 *                       type: number
 *                       description: Giá sản phẩm
 *                     reason:
 *                       type: string
 *                       description: Lý do trả hàng
 *               totalRefund:
 *                 type: number
 *                 description: Tổng số tiền hoàn trả
 *     responses:
 *       201:
 *         description: Tạo đơn trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng gốc
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createReturn);

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Lấy danh sách đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CHO_XU_LY, DA_HOAN_TIEN, DA_HUY]
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *           description: ID của khách hàng
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
 *         description: Lấy danh sách đơn trả hàng thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getReturns);

/**
 * @swagger
 * /returns/search:
 *   get:
 *     summary: Tìm kiếm đơn trả hàng theo mã QR hoặc mã đơn hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Tìm kiếm đơn trả hàng thành công
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/search', authenticate, authorizeAdmin, searchReturn);

/**
 * @swagger
 * /returns/stats:
 *   get:
 *     summary: Lấy thống kê đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Lấy thống kê đơn trả hàng thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/stats', authenticate, authorizeAdmin, getReturnStats);

/**
 * @swagger
 * /returns/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của đơn trả hàng
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn trả hàng thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getReturnById);

/**
 * @swagger
 * /returns/{id}:
 *   put:
 *     summary: Cập nhật thông tin đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của đơn trả hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 description: Danh sách sản phẩm trả lại
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     variant:
 *                       type: object
 *                       properties:
 *                         colorId:
 *                           type: string
 *                         sizeId:
 *                           type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     reason:
 *                       type: string
 *               totalRefund:
 *                 type: number
 *                 description: Tổng số tiền hoàn trả
 *     responses:
 *       200:
 *         description: Cập nhật đơn trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đơn hàng không còn ở trạng thái Chờ xử lý
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateReturn);

/**
 * @swagger
 * /returns/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của đơn trả hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CHO_XU_LY, DA_HOAN_TIEN, DA_HUY]
 *                 description: Trạng thái mới của đơn trả hàng
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đơn hàng không thể thay đổi trạng thái
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id/status', authenticate, authorizeAdmin, updateReturnStatus);

/**
 * @swagger
 * /returns/{id}:
 *   delete:
 *     summary: Xóa đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID của đơn trả hàng
 *     responses:
 *       200:
 *         description: Xóa đơn trả hàng thành công
 *       400:
 *         description: ID không hợp lệ hoặc đơn hàng không còn ở trạng thái Chờ xử lý
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteReturn);

export default router; 