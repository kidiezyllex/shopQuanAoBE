import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Tạo sản phẩm mới
 * @route POST /api/products
 * @access Private/Admin
 */
export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      brand, 
      category, 
      material, 
      description, 
      weight, 
      variants 
    } = req.body;

    if (!name || !brand || !category || !material || !description || !weight || !variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm'
      });
    }

    // Tìm brand, category, material
    const [brandDoc, categoryDoc, materialDoc] = await Promise.all([
      (!isNaN(brand) && !isNaN(parseInt(brand)))
        ? db.Brand.findByPk(parseInt(brand))
        : db.Brand.findOne({ where: { name: brand } }),
      (!isNaN(category) && !isNaN(parseInt(category)))
        ? db.Category.findByPk(parseInt(category))
        : db.Category.findOne({ where: { name: category } }),
      (!isNaN(material) && !isNaN(parseInt(material)))
        ? db.Material.findByPk(parseInt(material))
        : db.Material.findOne({ where: { name: material } })
    ]);

    if (!brandDoc) {
      return res.status(404).json({
        success: false,
        message: 'Thương hiệu không tồn tại'
      });
    }
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }
    if (!materialDoc) {
      return res.status(404).json({
        success: false,
        message: 'Chất liệu không tồn tại'
      });
    }

    // Tạo sản phẩm trước
    const newProduct = await db.Product.create({
      name,
      brandId: brandDoc.id,
      categoryId: categoryDoc.id,
      materialId: materialDoc.id,
      description,
      weight,
      status: 'HOAT_DONG'
    });

    // Xử lý variants
    for (const variant of variants) {
      if (!variant.colorId || !variant.sizeId || !variant.price || variant.price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi biến thể cần có màu sắc, kích cỡ và giá hợp lệ',
          variant
        });
      }

      // Validate stock value
      const validatedStockValue = parseInt(variant.stock) || parseInt(variant.quantity) || 0;
      if (validatedStockValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng tồn kho không được âm',
          variant
        });
      }

      let color, size;
      
      if (!isNaN(variant.colorId) && !isNaN(parseInt(variant.colorId))) {
        color = await db.Color.findByPk(parseInt(variant.colorId));
      } else {
        color = await db.Color.findOne({ where: { code: variant.colorId } });
      }
      
      if (!color) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy màu sắc: ${variant.colorId}`
        });
      }
      
      if (!isNaN(variant.sizeId) && !isNaN(parseInt(variant.sizeId))) {
        size = await db.Size.findByPk(parseInt(variant.sizeId));
      } else {
        const sizeValue = parseInt(variant.sizeId.toString().replace(/\D/g, ''));
        size = await db.Size.findOne({ where: { value: sizeValue } });
      }
      
      if (!size) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy kích cỡ: ${variant.sizeId}`
        });
      }

      // Tạo ProductVariant
      const productVariant = await db.ProductVariant.create({
        productId: newProduct.id,
        colorId: color.id,
        sizeId: size.id,
        price: parseFloat(variant.price),
        stock: validatedStockValue
      });

      // Tạo ProductVariantImages nếu có
      if (variant.images && variant.images.length > 0) {
        const imagePromises = variant.images.map(imageUrl => 
          db.ProductVariantImage.create({
            variantId: productVariant.id,
            imageUrl
          })
        );
        await Promise.all(imagePromises);
      }
    }

    // Lấy sản phẩm với đầy đủ thông tin
    const productWithDetails = await db.Product.findByPk(newProduct.id, {
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: productWithDetails
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // If it's a Sequelize validation error, provide more details
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Lỗi validation dữ liệu',
        error: error.message,
        details: error.errors ? error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        })) : null
      });
    }

    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Lỗi ràng buộc khóa ngoại - Kiểm tra lại ID của brand, category, material, color hoặc size',
        error: error.message,
        field: error.index || error.table
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo sản phẩm',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Lấy danh sách sản phẩm
 * @route GET /api/products
 * @access Public
 */
export const getProducts = async (req, res) => {
  try {
    const { 
      name, 
      brand, 
      category, 
      material, 
      minPrice, 
      maxPrice,
      color,
      size,
      status, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    const variantWhereConditions = {};
    
    if (name) {
      whereConditions.name = { [Op.like]: `%${name}%` };
    }
    
    if (brand) {
      if (Array.isArray(brand)) {
        whereConditions.brandId = { [Op.in]: brand };
      } else {
        whereConditions.brandId = brand;
      }
    }
    
    if (category) {
      if (Array.isArray(category)) {
        whereConditions.categoryId = { [Op.in]: category };
      } else {
        whereConditions.categoryId = category;
      }
    }
    
    if (material) {
      whereConditions.materialId = material;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    // Điều kiện cho variants
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        variantWhereConditions.price = { [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)] };
      } else if (minPrice) {
        variantWhereConditions.price = { [Op.gte]: parseFloat(minPrice) };
      } else if (maxPrice) {
        variantWhereConditions.price = { [Op.lte]: parseFloat(maxPrice) };
      }
    }
    
    if (color) {
      if (Array.isArray(color)) {
        variantWhereConditions.colorId = { [Op.in]: color };
      } else {
        variantWhereConditions.colorId = color;
      }
    }
    
    if (size) {
      if (Array.isArray(size)) {
        variantWhereConditions.sizeId = { [Op.in]: size };
      } else {
        variantWhereConditions.sizeId = size;
      }
    }

    const { count, rows: products } = await db.Product.findAndCountAll({
      where: whereConditions,
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          where: Object.keys(variantWhereConditions).length > 0 ? variantWhereConditions : undefined,
          required: Object.keys(variantWhereConditions).length > 0,
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: {
        products,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết sản phẩm
 * @route GET /api/products/:id
 * @access Public
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const product = await db.Product.findByPk(id, {
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin sản phẩm thành công',
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật sản phẩm
 * @route PUT /api/products/:id
 * @access Private/Admin
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { 
      name, 
      brand, 
      category, 
      material, 
      description, 
      weight, 
      variants, 
      status 
    } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }

    let brandId = brand;
    let categoryId = category;
    let materialId = material;

    if (brand && (isNaN(brand) || isNaN(parseInt(brand)))) {
      const brandDoc = await db.Brand.findOne({ where: { name: brand } });
      if (brandDoc) brandId = brandDoc.id;
    } else if (brand) {
      brandId = parseInt(brand);
    }
    if (category && (isNaN(category) || isNaN(parseInt(category)))) {
      const categoryDoc = await db.Category.findOne({ where: { name: category } });
      if (categoryDoc) categoryId = categoryDoc.id;
    } else if (category) {
      categoryId = parseInt(category);
    }
    if (material && (isNaN(material) || isNaN(parseInt(material)))) {
      const materialDoc = await db.Material.findOne({ where: { name: material } });
      if (materialDoc) materialId = materialDoc.id;
    } else if (material) {
      materialId = parseInt(material);
    }

    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Cập nhật thông tin sản phẩm
    if (name) product.name = name;
    if (brandId) product.brandId = brandId;
    if (categoryId) product.categoryId = categoryId;
    if (materialId) product.materialId = materialId;
    if (description) product.description = description;
    if (weight) product.weight = weight;
    if (status) product.status = status;

    await product.save();

    // Xử lý variants nếu có
    if (variants && variants.length > 0) {
      // Xóa tất cả variants cũ
      await db.ProductVariant.destroy({ where: { productId: id } });
      
      // Tạo variants mới
      for (const variant of variants) {
        const productVariant = await db.ProductVariant.create({
          productId: id,
          colorId: variant.colorId,
          sizeId: variant.sizeId,
          price: variant.price,
          quantity: variant.quantity || variant.stock || 0,
          status: 'HOAT_DONG'
        });

        // Tạo images cho variant nếu có
        if (variant.images && variant.images.length > 0) {
          const imagePromises = variant.images.map(imageUrl => 
            db.ProductVariantImage.create({
              variantId: productVariant.id,
              imageUrl
            })
          );
          await Promise.all(imagePromises);
        }
      }
    }

    // Lấy sản phẩm với đầy đủ thông tin sau khi cập nhật
    const updatedProduct = await db.Product.findByPk(id, {
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật sản phẩm',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm
 * @route DELETE /api/products/:id
 * @access Private/Admin
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Xóa tất cả variants và images liên quan
    await db.ProductVariant.destroy({ where: { productId: id } });
    
    // Xóa sản phẩm
    await product.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái sản phẩm
 * @route PATCH /api/products/:id/status
 * @access Private/Admin
 */
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!status || !['HOAT_DONG', 'KHONG_HOAT_DONG'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    product.status = status;
    await product.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái sản phẩm thành công',
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật tồn kho của biến thể sản phẩm
 * @route PATCH /api/products/:id/stock
 * @access Private/Admin
 */
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantUpdates } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!variantUpdates || !Array.isArray(variantUpdates) || variantUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách cập nhật tồn kho'
      });
    }
    
    const product = await db.Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    for (const update of variantUpdates) {
      const { variantId, quantity } = update;
      
      if (!variantId || quantity === undefined || quantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Thông tin cập nhật tồn kho không hợp lệ'
        });
      }
      
      const variant = await db.ProductVariant.findOne({
        where: { id: variantId, productId: id }
      });
      
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể với ID: ${variantId}`
        });
      }
      
      variant.quantity = quantity;
      await variant.save();
    }
    
    // Lấy sản phẩm với variants đã cập nhật
    const updatedProduct = await db.Product.findByPk(id, {
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công',
      data: updatedProduct
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tồn kho',
      error: error.message
    });
  }
};

/**
 * Tìm kiếm sản phẩm theo từ khóa
 * @route GET /api/products/search
 * @access Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { 
      keyword, 
      brand, 
      category, 
      material, 
      color, 
      size, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    const variantWhereConditions = {};
    
    if (keyword) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    if (brand) {
      whereConditions.brandId = Array.isArray(brand) ? { [Op.in]: brand } : brand;
    }
    
    if (category) {
      whereConditions.categoryId = Array.isArray(category) ? { [Op.in]: category } : category;
    }
    
    if (material) {
      whereConditions.materialId = material;
    }
    
    if (color) {
      variantWhereConditions.colorId = Array.isArray(color) ? { [Op.in]: color } : color;
    }
    
    if (size) {
      variantWhereConditions.sizeId = Array.isArray(size) ? { [Op.in]: size } : size;
    }
    
    if (minPrice || maxPrice) {
      if (minPrice && maxPrice) {
        variantWhereConditions.price = { [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)] };
      } else if (minPrice) {
        variantWhereConditions.price = { [Op.gte]: parseFloat(minPrice) };
      } else if (maxPrice) {
        variantWhereConditions.price = { [Op.lte]: parseFloat(maxPrice) };
      }
    }

    const { count, rows: products } = await db.Product.findAndCountAll({
      where: whereConditions,
      include: [
        { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
        { model: db.Category, as: 'category', attributes: ['id', 'name'] },
        { model: db.Material, as: 'material', attributes: ['id', 'name'] },
        {
          model: db.ProductVariant,
          as: 'variants',
          where: Object.keys(variantWhereConditions).length > 0 ? variantWhereConditions : undefined,
          required: Object.keys(variantWhereConditions).length > 0,
          include: [
            { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
            { model: db.Size, as: 'size', attributes: ['id', 'value'] },
            { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    return res.status(200).json({
      success: true,
      message: 'Tìm kiếm sản phẩm thành công',
      data: {
        products,
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
      message: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm',
      error: error.message
    });
  }
};

/**
 * Cập nhật hình ảnh sản phẩm
 * @route PUT /api/products/:id/images
 * @access Private/Admin
 */
export const updateProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId, images } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    if (!variantId || !images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID biến thể và danh sách hình ảnh'
      });
    }
    
    const variant = await db.ProductVariant.findOne({
      where: { id: variantId, productId: id }
    });
    
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }
    
    // Xóa tất cả hình ảnh cũ của variant
    await db.ProductVariantImage.destroy({
      where: { variantId: variantId }
    });
    
    // Thêm hình ảnh mới
    const imagePromises = images.map(imageUrl => 
      db.ProductVariantImage.create({
        variantId: variantId,
        imageUrl
      })
    );
    await Promise.all(imagePromises);
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật hình ảnh sản phẩm thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật hình ảnh sản phẩm',
      error: error.message
    });
  }
};

/**
 * Lấy tất cả bộ lọc
 * @route GET /api/products/filters
 * @access Public
 */
export const getAllFilters = async (req, res) => {
  try {
    const [brands, categories, materials, colors, sizes] = await Promise.all([
      db.Brand.findAll({ where: { status: 'HOAT_DONG' }, attributes: ['id', 'name'] }),
      db.Category.findAll({ where: { status: 'HOAT_DONG' }, attributes: ['id', 'name'] }),
      db.Material.findAll({ where: { status: 'HOAT_DONG' }, attributes: ['id', 'name'] }),
      db.Color.findAll({ where: { status: 'HOAT_DONG' }, attributes: ['id', 'name', 'code'] }),
      db.Size.findAll({ where: { status: 'HOAT_DONG' }, attributes: ['id', 'value'] })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lấy bộ lọc thành công',
      data: {
        brands,
        categories,
        materials,
        colors,
        sizes
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy bộ lọc',
      error: error.message
    });
  }
}; 