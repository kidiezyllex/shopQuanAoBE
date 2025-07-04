import express from 'express';
import { brandController, categoryController, materialController, colorController, sizeController } from '../controllers/attribute.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: API endpoints for managing brands
 */

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
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
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.route('/brands')
  .get(brandController.getAll)
  .post(protect, admin, brandController.create);

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Get a brand by id
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Brand id
 *     responses:
 *       200:
 *         description: Brand details
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Brand id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Brand id
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.route('/brands/:id')
  .get(brandController.getById)
  .put(protect, admin, brandController.update)
  .delete(protect, admin, brandController.delete);

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API endpoints for managing categories
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.route('/categories')
  .get(categoryController.getAll)
  .post(protect, admin, categoryController.create);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by id
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category id
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.route('/categories/:id')
  .get(categoryController.getById)
  .put(protect, admin, categoryController.update)
  .delete(protect, admin, categoryController.delete);

/**
 * @swagger
 * tags:
 *   name: Materials
 *   description: API endpoints for managing materials
 */

/**
 * @swagger
 * /materials:
 *   get:
 *     summary: Get all materials
 *     tags: [Materials]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of materials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Material'
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new material
 *     tags: [Materials]
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
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       201:
 *         description: Material created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.route('/materials')
  .get(materialController.getAll)
  .post(protect, admin, materialController.create);

/**
 * @swagger
 * /materials/{id}:
 *   get:
 *     summary: Get a material by id
 *     tags: [Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Material id
 *     responses:
 *       200:
 *         description: Material details
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Material id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Material updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Material id
 *     responses:
 *       200:
 *         description: Material deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Material not found
 *       500:
 *         description: Server error
 */
router.route('/materials/:id')
  .get(materialController.getById)
  .put(protect, admin, materialController.update)
  .delete(protect, admin, materialController.delete);

/**
 * @swagger
 * tags:
 *   name: Colors
 *   description: API endpoints for managing colors
 */

/**
 * @swagger
 * /colors:
 *   get:
 *     summary: Get all colors
 *     tags: [Colors]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of colors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Color'
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new color
 *     tags: [Colors]
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       201:
 *         description: Color created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.route('/colors')
  .get(colorController.getAll)
  .post(protect, admin, colorController.create);

/**
 * @swagger
 * /colors/{id}:
 *   get:
 *     summary: Get a color by id
 *     tags: [Colors]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Color id
 *     responses:
 *       200:
 *         description: Color details
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a color
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Color id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Color updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a color
 *     tags: [Colors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Color id
 *     responses:
 *       200:
 *         description: Color deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Color not found
 *       500:
 *         description: Server error
 */
router.route('/colors/:id')
  .get(colorController.getById)
  .put(protect, admin, colorController.update)
  .delete(protect, admin, colorController.delete);

/**
 * @swagger
 * tags:
 *   name: Sizes
 *   description: API endpoints for managing sizes
 */

/**
 * @swagger
 * /sizes:
 *   get:
 *     summary: Get all sizes
 *     tags: [Sizes]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: A list of sizes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Size'
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new size
 *     tags: [Sizes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       201:
 *         description: Size created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.route('/sizes')
  .get(sizeController.getAll)
  .post(protect, admin, sizeController.create);

/**
 * @swagger
 * /sizes/{id}:
 *   get:
 *     summary: Get a size by id
 *     tags: [Sizes]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size id
 *     responses:
 *       200:
 *         description: Size details
 *       404:
 *         description: Size not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a size
 *     tags: [Sizes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, INACTIVE]
 *     responses:
 *       200:
 *         description: Size updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Size not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a size
 *     tags: [Sizes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Size id
 *     responses:
 *       200:
 *         description: Size deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Size not found
 *       500:
 *         description: Server error
 */
router.route('/sizes/:id')
  .get(sizeController.getById)
  .put(protect, admin, sizeController.update)
  .delete(protect, admin, sizeController.delete);

export default router; 