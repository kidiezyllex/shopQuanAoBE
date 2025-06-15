import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  updateOrderStatus,
  getMyOrders,
  getOrdersByUserId,
  createPOSOrder
} from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - items
 *               - subTotal
 *               - total
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID của đơn hàng (tùy chọn, dùng cho POS)
 *               customer:
 *                 type: string
 *                 description: ID của khách hàng
 *               items:
 *                 type: array
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
 *                       minimum: 1
 *                     price:
 *                       type: number
 *               voucher:
 *                 type: string
 *                 description: ID của voucher
 *               subTotal:
 *                 type: number
 *                 description: Tổng tiền trước khi giảm giá
 *               discount:
 *                 type: number
 *                 description: Số tiền giảm giá
 *               total:
 *                 type: number
 *                 description: Tổng tiền sau khi giảm giá
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   provinceId:
 *                     type: string
 *                   districtId:
 *                     type: string
 *                   wardId:
 *                     type: string
 *                   specificAddress:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, COD, MIXED]
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', createOrder);

/**
 * @swagger
 * /orders/pos:
 *   post:
 *     summary: Tạo đơn hàng POS mới (tại quầy)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: [] # Assuming POS operations require authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - items
 *               - subTotal
 *               - total
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID của đơn hàng POS (ví dụ: POS073618)
 *                 example: "POS073618"
 *               customer:
 *                 type: string # Could be a customer ID or a name string
 *                 description: Tên khách hàng hoặc ID khách hàng. Nếu là tên, sẽ được lưu trực tiếp.
 *                 example: "Teu Young Boy"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                     - price
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID của sản phẩm
 *                       example: "681a2fd531964fccfb60add7"
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       example: 1
 *                     price:
 *                       type: number
 *                       description: Giá bán tại thời điểm mua POS (có thể khác giá niêm yết)
 *                       example: 3890000
 *                     variant:
 *                       type: object
 *                       properties:
 *                         colorId:
 *                           type: string
 *                           example: "681162d2893c72093670b267"
 *                         sizeId:
 *                           type: string
 *                           example: "68116b5c893c72093670b4d7"
 *               subTotal:
 *                 type: number
 *                 description: Tổng tiền trước khi giảm giá
 *                 example: 6180000
 *               total:
 *                 type: number
 *                 description: Tổng tiền sau khi giảm giá (bằng subTotal nếu không có discount)
 *                 example: 6180000
 *               shippingAddress:
 *                 type: object
 *                 description: Thông tin giao hàng (tùy chọn, sẽ được mặc định cho đơn POS)
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Teu Young Boy"
 *                   phoneNumber:
 *                     type: string
 *                     example: "09343223432"
 *                   provinceId:
 *                     type: string
 *                     example: "N/A"
 *                   districtId:
 *                     type: string
 *                     example: "N/A"
 *                   wardId:
 *                     type: string
 *                     example: "N/A"
 *                   specificAddress:
 *                     type: string
 *                     example: "Tại quầy"
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER, COD, MIXED] # Consider if other methods are valid for POS
 *                 example: "CASH"
 *               discount:
 *                 type: number
 *                 description: Số tiền giảm giá
 *                 example: 0
 *               voucher:
 *                 type: string
 *                 description: ID của voucher (nếu có)
 *                 example: ""
 *     responses:
 *       201:
 *         description: Tạo đơn hàng POS thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order' # Assuming you have an Order schema
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập (Chưa đăng nhập)
 *       403:
 *         description: Không có quyền thực hiện (VD: không phải admin/staff)
 *       409:
 *         description: Xung đột dữ liệu (VD: Mã đơn hàng đã tồn tại)
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/pos', authenticate, authorizeAdmin, createPOSOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Lọc theo ID khách hàng
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *           enum: [CHO_XAC_NHAN, CHO_GIAO_HANG, DANG_VAN_CHUYEN, DA_GIAO_HANG, HOAN_THANH, DA_HUY]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, PARTIAL_PAID, PAID]
 *         description: Lọc theo trạng thái thanh toán
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo mã đơn hàng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getOrders);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng đăng nhập
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderStatus
 *         schema:
 *           type: string
 *           enum: [CHO_XAC_NHAN, CHO_GIAO_HANG, DANG_VAN_CHUYEN, DA_GIAO_HANG, HOAN_THANH, DA_HUY]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/my-orders', authenticate, getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Lấy thông tin đơn hàng thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   provinceId:
 *                     type: string
 *                   districtId:
 *                     type: string
 *                   wardId:
 *                     type: string
 *                   specificAddress:
 *                     type: string
 *               orderStatus:
 *                 type: string
 *                 enum: [CHO_XAC_NHAN, CHO_GIAO_HANG, DANG_VAN_CHUYEN, DA_GIAO_HANG, HOAN_THANH, DA_HUY]
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PARTIAL_PAID, PAID]
 *     responses:
 *       200:
 *         description: Cập nhật đơn hàng thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateOrder);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *       400:
 *         description: ID không hợp lệ hoặc không thể hủy đơn hàng ở trạng thái hiện tại
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền hủy đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/cancel', authenticate, cancelOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
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
 *                 enum: [CHO_XAC_NHAN, CHO_GIAO_HANG, DANG_VAN_CHUYEN, DA_GIAO_HANG, HOAN_THANH, DA_HUY]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn hàng thành công
 *       400:
 *         description: ID không hợp lệ hoặc thiếu trạng thái
 *       401:
 *         description: Không có quyền truy cập
 *       403:
 *         description: Không có quyền admin
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/status', authenticate, authorizeAdmin, updateOrderStatus);

/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo ID người dùng
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách đơn hàng thành công
 *       400:
 *         description: ID người dùng không hợp lệ
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/user/:userId', getOrdersByUserId);

export default router; 