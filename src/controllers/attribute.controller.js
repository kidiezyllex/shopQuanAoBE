import { db } from '../config/database.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the brand
 *         name:
 *           type: string
 *           description: The brand name
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: The brand status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the brand was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the brand was last updated
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: The category name
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: The category status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the category was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the category was last updated
 *     Material:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the material
 *         name:
 *           type: string
 *           description: The material name
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: The material status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the material was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the material was last updated
 *     Color:
 *       type: object
 *       required:
 *         - name
 *         - code
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the color
 *         name:
 *           type: string
 *           description: The color name
 *         code:
 *           type: string
 *           description: The color code (hex)
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: The color status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the color was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the color was last updated
 *     Size:
 *       type: object
 *       required:
 *         - value
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the size
 *         value:
 *           type: number
 *           description: The size value
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           description: The size status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the size was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the size was last updated
 */

const createGenericController = (Model) => {
  return {
    create: async (req, res) => {
      try {
        const savedAttribute = await Model.create(req.body);
        res.status(201).json({
          success: true,
          data: savedAttribute,
          message: 'Created successfully',
        });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
          });
        }
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    getAll: async (req, res) => {
      try {
        const { status } = req.query;
        let whereConditions = {};
        
        if (status) {
          whereConditions.status = status;
        }
        
        const attributes = await Model.findAll({
          where: whereConditions,
          order: [['createdAt', 'DESC']]
        });
        
        res.status(200).json({
          success: true,
          data: attributes,
          message: 'Retrieved successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    getById: async (req, res) => {
      try {
        const attribute = await Model.findByPk(req.params.id);
        if (!attribute) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        res.status(200).json({
          success: true,
          data: attribute,
          message: 'Retrieved successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    update: async (req, res) => {
      try {
        const [updatedRowsCount] = await Model.update(req.body, {
          where: { id: req.params.id }
        });
        
        if (updatedRowsCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        
        const updatedAttribute = await Model.findByPk(req.params.id);
        
        res.status(200).json({
          success: true,
          data: updatedAttribute,
          message: 'Updated successfully',
        });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            success: false,
            message: 'Duplicate entry. This record already exists.',
          });
        }
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },

    delete: async (req, res) => {
      try {
        const deletedRowsCount = await Model.destroy({
          where: { id: req.params.id }
        });
        
        if (deletedRowsCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Not found',
          });
        }
        
        res.status(200).json({
          success: true,
          message: 'Deleted successfully',
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    },
  };
};

// Create controllers for each model
export const brandController = createGenericController(db.Brand);
export const categoryController = createGenericController(db.Category);
export const materialController = createGenericController(db.Material);
export const colorController = createGenericController(db.Color);
export const sizeController = createGenericController(db.Size); 