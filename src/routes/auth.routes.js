import express from 'express';
import {
  login,
  register,
  getCurrentAccount,
  changePassword,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     account:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         code:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                           format: email
 *                         phoneNumber:
 *                           type: string
 *                         role:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Mật khẩu không chính xác
 *       403:
 *         description: Tài khoản đã bị khóa
 *       404:
 *         description: Email không tồn tại
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     description: Đăng ký người dùng mới. Mặc định vai trò là CUSTOMER.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Họ tên đầy đủ
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email (duy nhất)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (duy nhất nếu có)
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng ký tài khoản thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     account:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         code:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                           format: email
 *                         phoneNumber:
 *                           type: string
 *                         role:
 *                           type: string
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Email hoặc số điện thoại đã được sử dụng
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin tài khoản
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin tài khoản thành công
 *                 data:
 *                   type: object
 *                   description: Thông tin chi tiết của tài khoản (trừ mật khẩu)
 *                   properties:
 *                     _id:
 *                       type: string
 *                     code:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     phoneNumber:
 *                       type: string
 *                     birthday:
 *                       type: string
 *                       format: date-time
 *                     gender:
 *                       type: boolean
 *                       description: "Giới tính (true: Nam, false: Nữ)"
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [HOAT_DONG, INACTIVE]
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                           provinceId:
 *                             type: string
 *                           districtId:
 *                             type: string
 *                           wardId:
 *                             type: string
 *                           specificAddress:
 *                             type: string
 *                           type:
 *                             type: boolean
 *                             description: "Loại địa chỉ (true: Công ty, false: Nhà riêng)"
 *                           isDefault:
 *                             type: boolean
 *                             description: Địa chỉ mặc định
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Không được phép truy cập (Token không hợp lệ hoặc thiếu)
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/profile', protect, getCurrentAccount);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Thay đổi mật khẩu người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu hiện tại
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Thay đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Thay đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không chính xác
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/change-password', protect, changePassword);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: boolean
 *                 description: "Giới tính (true: Nam, false: Nữ)"
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật thông tin tài khoản thành công
 *                 data:
 *                   type: object
 *                   $ref: '#/components/schemas/Account'
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/update-profile', protect, updateProfile);

/**
 * @swagger
 * /auth/address:
 *   post:
 *     summary: Thêm địa chỉ mới cho người dùng
 *     tags: [Auth]
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
 *               - phoneNumber
 *               - provinceId
 *               - districtId
 *               - wardId
 *               - specificAddress
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên người nhận
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại người nhận
 *               provinceId:
 *                 type: string
 *                 description: ID Tỉnh/Thành phố
 *               districtId:
 *                 type: string
 *                 description: ID Quận/Huyện
 *               wardId:
 *                 type: string
 *                 description: ID Phường/Xã
 *               specificAddress:
 *                 type: string
 *                 description: Địa chỉ cụ thể (số nhà, tên đường)
 *               type:
 *                 type: boolean
 *                 description: "Loại địa chỉ (true: Công ty, false: Nhà riêng - Mặc định false)"
 *                 default: false
 *               isDefault:
 *                 type: boolean
 *                 description: Đặt làm địa chỉ mặc định (Mặc định false)
 *                 default: false
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Thêm địa chỉ mới thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/address', protect, addAddress);

/**
 * @swagger
 * /auth/address/{addressId}:
 *   put:
 *     summary: Cập nhật địa chỉ của người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               provinceId:
 *                 type: string
 *               districtId:
 *                 type: string
 *               wardId:
 *                 type: string
 *               specificAddress:
 *                 type: string
 *               type:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cập nhật địa chỉ thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/address/:addressId', protect, updateAddress);

/**
 * @swagger
 * /auth/address/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ của người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ cần xóa
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Xóa địa chỉ thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/address/:addressId', protect, deleteAddress);

/**
 * @swagger
 * /auth/address/{addressId}/default:
 *   put:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của địa chỉ cần đặt làm mặc định
 *     responses:
 *       200:
 *         description: Đặt địa chỉ mặc định thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đặt địa chỉ mặc định thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/address/:addressId/default', protect, setDefaultAddress);

/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *         fullName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phoneNumber:
 *           type: string
 *         birthday:
 *           type: string
 *           format: date-time
 *         gender:
 *           type: boolean
 *           description: "Giới tính (true: Nam, false: Nữ)"
 *         avatar:
 *           type: string
 *         role:
 *           type: string
 *           enum: [CUSTOMER, ADMIN, STAFF]
 *         status:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         addresses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Address'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Address:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         provinceId:
 *           type: string
 *         districtId:
 *           type: string
 *         wardId:
 *           type: string
 *         specificAddress:
 *           type: string
 *         type:
 *           type: boolean
 *           description: "Loại địa chỉ (true: Công ty, false: Nhà riêng)"
 *         isDefault:
 *           type: boolean
 *           description: Địa chỉ mặc định
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router; 