import express from 'express';
import {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  updateAccountStatus,
  deleteAccount,
  addAddress,
  updateAddress,
  deleteAddress,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/account.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /account:
 *   get:
 *     summary: Lấy danh sách tất cả tài khoản (Admin)
 *     tags: [Account (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: "Lọc theo vai trò (ADMIN, STAFF, CUSTOMER)"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "Lọc theo trạng thái (HOAT_DONG, KHONG_HOAT_DONG)"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Tìm kiếm theo tên, email, số điện thoại, mã tài khoản"
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
 *         description: Số lượng trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách tài khoản
 *       401:
 *         description: "Không được phép (Không phải Admin)"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.get('/', protect, admin, getAllAccounts);

/**
 * @swagger
 * /account/profile:
 *   get:
 *     summary: Lấy hồ sơ cá nhân của người dùng đang đăng nhập
 *     tags: [Account (User)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy hồ sơ thành công
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.get('/profile', protect, getProfile);

/**
 * @swagger
 * /account/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân của người dùng đang đăng nhập
 *     tags: [Account (User)]
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
 *               gender:
 *                 type: string
 *                 enum: [Nam, Nữ, Khác]
 *               birthday:
 *                 type: string
 *                 format: date
 *               avatar:
 *                 type: string
 *                 format: url
 *             example:
 *               fullName: "Người Dùng Cập Nhật"
 *               phoneNumber: "0999888777"
 *               gender: "Khác"
 *               birthday: "1999-12-31"
 *               avatar: "https://example.com/new_avatar.jpg"
 *     responses:
 *       200:
 *         description: "Cập nhật hồ sơ thành công"
 *       400:
 *         description: "Dữ liệu không hợp lệ (vd: SĐT đã tồn tại)"
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /account/profile/password:
 *   put:
 *     summary: Đổi mật khẩu của người dùng đang đăng nhập
 *     tags: [Account (User)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 required: true
 *               newPassword:
 *                 type: string
 *                 required: true
 *               confirmPassword:
 *                 type: string
 *                 required: true
 *             example:
 *               currentPassword: "password123"
 *               newPassword: "newPassword456"
 *               confirmPassword: "newPassword456"
 *     responses:
 *       200:
 *         description: "Đổi mật khẩu thành công"
 *       400:
 *         description: "Lỗi dữ liệu đầu vào (vd: mật khẩu hiện tại sai, mật khẩu mới không khớp)"
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.put('/profile/password', protect, changePassword);

/**
 * @swagger
 * /account/profile/addresses:
 *   post:
 *     summary: Thêm địa chỉ mới cho người dùng đang đăng nhập
 *     tags: [Account (User)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *               phoneNumber:
 *                 type: string
 *                 required: true
 *               provinceId:
 *                 type: integer
 *                 required: true
 *               districtId:
 *                 type: integer
 *                 required: true
 *               wardId:
 *                 type: integer
 *                 required: true
 *               specificAddress:
 *                 type: string
 *                 required: true
 *               type:
 *                 type: string
 *                 enum: [Nhà riêng, Văn phòng]
 *                 required: true
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *             example:
 *               name: "Nhà riêng"
 *               phoneNumber: "0123456789"
 *               provinceId: 201 # Mã tỉnh/thành phố
 *               districtId: 3442 # Mã quận/huyện
 *               wardId: 100101 # Mã phường/xã
 *               specificAddress: "Số 123, Đường ABC"
 *               type: "Nhà riêng"
 *               isDefault: true
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.post('/profile/addresses', protect, (req, res, next) => {
    req.params.id = req.account._id;
    next();
}, addAddress);

/**
 * @swagger
 * /account/profile/addresses/{addressId}:
 *   put:
 *     summary: Cập nhật địa chỉ của người dùng đang đăng nhập
 *     tags: [Account (User)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID địa chỉ cần cập nhật
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
 *                 type: integer
 *               districtId:
 *                 type: integer
 *               wardId:
 *                 type: integer
 *               specificAddress:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Nhà riêng, Văn phòng]
 *               isDefault:
 *                 type: boolean
 *             example:
 *               name: "Văn phòng mới"
 *               phoneNumber: "0987654321"
 *               provinceId: 201
 *               districtId: 3442
 *               wardId: 100102
 *               specificAddress: "Tầng 5, Tòa nhà XYZ"
 *               type: "Văn phòng"
 *               isDefault: false
 *     responses:
 *       200:
 *         description: "Cập nhật địa chỉ thành công"
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản hoặc địa chỉ"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.put('/profile/addresses/:addressId', protect, (req, res, next) => {
    req.params.id = req.account._id;
    next();
}, updateAddress);

/**
 * @swagger
 * /account/profile/addresses/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ của người dùng đang đăng nhập
 *     tags: [Account (User)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID địa chỉ cần xóa
 *     responses:
 *       200:
 *         description: "Xóa địa chỉ thành công"
 *       401:
 *         description: "Không được phép (Chưa đăng nhập)"
 *       404:
 *         description: "Không tìm thấy tài khoản hoặc địa chỉ"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.delete('/profile/addresses/:addressId', protect, (req, res, next) => {
    req.params.id = req.account._id;
    next();
}, deleteAddress);

/**
 * @swagger
 * /account/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết tài khoản theo ID (Admin)
 *     tags: [Account (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản
 *     responses:
 *       200:
 *         description: Thông tin chi tiết tài khoản
 *       401:
 *         description: "Không được phép (Không phải Admin)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.get('/:id', protect, admin, getAccountById);

/**
 * @swagger
 * /account/{id}:
 *   put:
 *     summary: Cập nhật thông tin tài khoản bởi Admin
 *     tags: [Account (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [Nam, Nữ, Khác]
 *               birthday:
 *                 type: string
 *                 format: date
 *               citizenId:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: url
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *             example:
 *               fullName: "Admin Cập Nhật"
 *               email: "updated.email@example.com"
 *               phoneNumber: "0987654322"
 *               gender: "Nữ"
 *               birthday: "1995-05-15"
 *               citizenId: "987654321012"
 *               avatar: "https://example.com/avatar_updated.jpg"
 *               status: "HOAT_DONG"
 *     responses:
 *       200:
 *         description: "Cập nhật tài khoản thành công"
 *       400:
 *         description: "Dữ liệu không hợp lệ (vd: email/sđt đã tồn tại)"
 *       401:
 *         description: "Không được phép (Không phải Admin)"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.put('/:id', protect, admin, updateAccount);

/**
 * @swagger
 * /account/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái tài khoản (kích hoạt/vô hiệu hóa) (Admin)
 *     tags: [Account (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *                 required: true
 *             example:
 *               status: "KHONG_HOAT_DONG"
 *     responses:
 *       200:
 *         description: "Cập nhật trạng thái thành công"
 *       400:
 *         description: "Trạng thái không hợp lệ hoặc thiếu"
 *       401:
 *         description: "Không được phép (Không phải Admin)"
 *       403:
 *         description: "Không thể vô hiệu hóa tài khoản Admin chính"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.put('/:id/status', protect, admin, updateAccountStatus);

/**
 * @swagger
 * /account/{id}:
 *   delete:
 *     summary: Xóa tài khoản (Admin)
 *     tags: [Account (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản cần xóa
 *     responses:
 *       200:
 *         description: "Xóa tài khoản thành công"
 *       401:
 *         description: "Không được phép (Không phải Admin)"
 *       403:
 *         description: "Không thể xóa tài khoản Admin chính"
 *       404:
 *         description: "Không tìm thấy tài khoản"
 *       500:
 *         description: "Lỗi máy chủ"
 */
router.delete('/:id', protect, admin, deleteAccount);

/**
 * @swagger
 * /account/register:
 *   post:
 *     summary: Tạo tài khoản mới (Đăng ký)
 *     tags: [Account (Public)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 required: true
 *               email:
 *                 type: string
 *                 format: email
 *                 required: true
 *               password:
 *                 type: string
 *                 required: true
 *               phoneNumber:
 *                 type: string
 *                 required: true
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, STAFF, ADMIN]
 *                 default: CUSTOMER
 *               gender:
 *                 type: string
 *                 enum: [Nam, Nữ, Khác]
 *               birthday:
 *                 type: string
 *                 format: date
 *               citizenId:
 *                  type: string
 *             example:
 *               fullName: "Người Dùng Mới"
 *               email: "newuser@example.com"
 *               password: "password123"
 *               phoneNumber: "0123456789"
 *               gender: "Nam"
 *               birthday: "2000-01-01"
 *               citizenId: "123456789012"
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc Email/SĐT đã được sử dụng
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/register', createAccount);

export default router; 