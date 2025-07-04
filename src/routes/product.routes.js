import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  updateProductImages,
  searchProducts,
  getAllFilters
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Products]
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
 *               - brand
 *               - category
 *               - material
 *               - description
 *               - weight
 *               - variants
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               material:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     colorId:
 *                       type: string
 *                     sizeId:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createProduct);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên sản phẩm
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo ID thương hiệu (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo ID danh mục (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Lọc theo ID chất liệu
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Lọc theo ID màu sắc (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Lọc theo ID kích cỡ (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá thấp nhất
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá cao nhất
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Trạng thái sản phẩm
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
 *         description: Số lượng sản phẩm mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', getProducts);

/**
 * @swagger
 * /products/filters:
 *   get:
 *     summary: Lấy tất cả các thuộc tính lọc sản phẩm
 *     tags: [Products]
 *     description: Trả về danh sách các thuộc tính lọc như màu sắc, kích cỡ, thương hiệu, danh mục, chất liệu và khoảng giá
 *     responses:
 *       200:
 *         description: Lấy danh sách bộ lọc thành công
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/filters', getAllFilters);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo từ khóa kết hợp với bộ lọc
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (theo tên hoặc mã sản phẩm)
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo ID thương hiệu (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo ID danh mục (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *         description: Lọc theo ID chất liệu
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Lọc theo ID màu sắc (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Lọc theo ID kích cỡ (có thể truyền nhiều ID, phân tách bằng dấu phẩy)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá thấp nhất
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá cao nhất
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
 *         description: Số lượng sản phẩm mỗi trang
 *     responses:
 *       200:
 *         description: Tìm kiếm sản phẩm thành công
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin sản phẩm thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
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
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               material:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     colorId:
 *                       type: string
 *                     sizeId:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [Products]
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
 *         description: Xóa sản phẩm thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

/**
 * @swagger
 * /products/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái sản phẩm
 *     tags: [Products]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/status', authenticate, authorizeAdmin, updateProductStatus);

/**
 * @swagger
 * /products/{id}/stock:
 *   patch:
 *     summary: Cập nhật tồn kho của các biến thể sản phẩm
 *     tags: [Products]
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
 *             required:
 *               - variantUpdates
 *             properties:
 *               variantUpdates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - variantId
 *                     - stock
 *                   properties:
 *                     variantId:
 *                       type: string
 *                     stock:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/stock', authenticate, authorizeAdmin, updateProductStock);

/**
 * @swagger
 * /products/{id}/images:
 *   patch:
 *     summary: Cập nhật hình ảnh của biến thể sản phẩm
 *     tags: [Products]
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
 *             required:
 *               - variantId
 *               - images
 *             properties:
 *               variantId:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật hình ảnh thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/images', authenticate, authorizeAdmin, updateProductImages);

export default router; 