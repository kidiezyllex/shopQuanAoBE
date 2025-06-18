import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Tạo chương trình khuyến mãi mới
 * @route POST /api/promotions
 * @access Private/Admin
 */
export const createPromotion = async (req, res) => {
  try {
    const { name, description, discountPercent, products, startDate, endDate } = req.body;
    const productIds = products; // Map products to productIds for backwards compatibility

    // Kiểm tra các trường bắt buộc
    if (!name || !discountPercent || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: name, discountPercent, startDate, endDate'
      });
    }

    // Kiểm tra discountPercent hợp lệ
    if (discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Phần trăm giảm giá phải từ 0 đến 100'
      });
    }

    // Kiểm tra thời gian hợp lệ
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      });
    }

    // Kiểm tra products có hợp lệ không
    if (productIds && productIds.length > 0) {
      const invalidProducts = productIds.filter(id => !Number.isInteger(parseInt(id)) || parseInt(id) <= 0);
      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách sản phẩm không hợp lệ'
        });
      }

      // Kiểm tra sản phẩm có tồn tại không
      const existingProducts = await db.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: ['id']
      });

      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số sản phẩm không tồn tại'
        });
      }
    }

    // Tạo chương trình khuyến mãi mới
    const newPromotion = await db.Promotion.create({
      name,
      description,
      discountPercent,
      productIds: productIds ? JSON.stringify(productIds) : null,
      startDate,
      endDate,
      status: 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo chương trình khuyến mãi thành công',
      data: newPromotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo chương trình khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách chương trình khuyến mãi
 * @route GET /api/promotions
 * @access Private/Admin
 */
export const getPromotions = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (startDate && endDate) {
      whereConditions[Op.and] = [
        { startDate: { [Op.lte]: new Date(endDate) } },
        { endDate: { [Op.gte]: new Date(startDate) } }
      ];
    }
    
    // Thực hiện query với phân trang
    const { count, rows: promotions } = await db.Promotion.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách chương trình khuyến mãi thành công',
      data: {
        promotions,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết chương trình khuyến mãi
 * @route GET /api/promotions/:id
 * @access Private/Admin
 */
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    const promotion = await db.Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }

    // Lấy thông tin sản phẩm nếu có
    let products = [];
    if (promotion.productIds) {
      try {
        const productIds = JSON.parse(promotion.productIds);
        products = await db.Product.findAll({
          where: { id: { [Op.in]: productIds } },
          attributes: ['id', 'name', 'code', 'price'],
          include: [
            {
              model: db.ProductVariantImage,
              as: 'images',
              attributes: ['id', 'imageUrl'],
              limit: 1
            }
          ]
        });
      } catch (parseError) {
        console.error('Error parsing productIds:', parseError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin chương trình khuyến mãi thành công',
      data: {
        ...promotion.toJSON(),
        products
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin chương trình khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Cập nhật chương trình khuyến mãi
 * @route PUT /api/promotions/:id
 * @access Private/Admin
 */
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, discountPercent, productIds, startDate, endDate, status } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    const promotion = await db.Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }
    
    // Kiểm tra discountPercent hợp lệ
    if (discountPercent !== undefined && (discountPercent < 0 || discountPercent > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Phần trăm giảm giá phải từ 0 đến 100'
      });
    }
    
    // Kiểm tra thời gian hợp lệ
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }
    }
    
    // Kiểm tra products có hợp lệ không
    if (productIds && productIds.length > 0) {
      const invalidProducts = productIds.filter(id => !Number.isInteger(parseInt(id)) || parseInt(id) <= 0);
      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách sản phẩm không hợp lệ'
        });
      }

      // Kiểm tra sản phẩm có tồn tại không
      const existingProducts = await db.Product.findAll({
        where: { id: { [Op.in]: productIds } },
        attributes: ['id']
      });

      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số sản phẩm không tồn tại'
        });
      }
    }
    
    // Cập nhật thông tin
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
    if (productIds !== undefined) promotion.productIds = productIds ? JSON.stringify(productIds) : null;
    if (startDate) promotion.startDate = startDate;
    if (endDate) promotion.endDate = endDate;
    if (status) promotion.status = status;
    
    await promotion.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật chương trình khuyến mãi thành công',
      data: promotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật chương trình khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Xóa chương trình khuyến mãi
 * @route DELETE /api/promotions/:id
 * @access Private/Admin
 */
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    const promotion = await db.Promotion.findByPk(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }
    
    await promotion.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa chương trình khuyến mãi thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa chương trình khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách khuyến mãi của sản phẩm
 * @route GET /api/promotions/product/:productId
 * @access Public
 */
export const getProductPromotions = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!Number.isInteger(parseInt(productId)) || parseInt(productId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const now = new Date();
    
    // Tìm các chương trình khuyến mãi đang hoạt động và chứa sản phẩm này
    const promotions = await db.Promotion.findAll({
      where: {
        status: 'ACTIVE',
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
        productIds: { [Op.like]: `%"${productId}"%` }
      },
      order: [['discountPercent', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách khuyến mãi của sản phẩm thành công',
      data: promotions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
}; 