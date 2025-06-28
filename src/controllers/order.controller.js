import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Helper function để cập nhật stock của sản phẩm
 * @param {Array} items - Danh sách items trong đơn hàng
 * @param {Number} multiplier - 1 để trừ stock, -1 để cộng stock
 */
const updateProductStock = async (items, multiplier = 1) => {
  for (const item of items) {
    let variantId;
    
    if (item.resolvedVariantId) {
      variantId = item.resolvedVariantId;
    } else if (item.variantId) {
      variantId = item.variantId;
    } else if (item.productVariantId) {
      variantId = item.productVariantId;
    } else {
      continue; 
    }

    if (!Number.isInteger(parseInt(variantId)) || parseInt(variantId) <= 0) {
      continue; 
    }

    const variant = await db.ProductVariant.findByPk(variantId);

    if (variant) {
      const stockField = variant.stock !== undefined ? 'stock' : 'quantity';
      const currentStock = variant[stockField] || 0;
      
      if (multiplier === 1) {
        if (currentStock >= item.quantity) {
          await variant.update({ [stockField]: currentStock - item.quantity });
        }
      } else {
        await variant.update({ [stockField]: currentStock + item.quantity });
      }
    }
  }
};

/**
 * Tạo đơn hàng mới
 * @route POST /api/orders
 * @access Private
 */
export const createOrder = async (req, res) => {
  try {
    const { 
      orderId,
      customerId, 
      items, 
      voucherId, 
      subTotal, 
      discount, 
      total, 
      shippingAddress,
      paymentMethod 
    } = req.body;

    // Validate required fields
    const validationErrors = [];
    
    if (!customerId) {
      validationErrors.push('customerId là bắt buộc');
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      validationErrors.push('items là bắt buộc và phải là mảng không rỗng');
    }
    
    if (subTotal === undefined || subTotal === null) {
      validationErrors.push('subTotal là bắt buộc');
    }
    
    if (total === undefined || total === null) {
      validationErrors.push('total là bắt buộc');
    }
    
    if (!paymentMethod) {
      validationErrors.push('paymentMethod là bắt buộc');
    }
    
    if (!shippingAddress) {
      validationErrors.push('shippingAddress là bắt buộc');
    } else {
      // Validate shipping address fields
      if (!shippingAddress.name) {
        validationErrors.push('shippingAddress.name là bắt buộc');
      }
      if (!shippingAddress.phoneNumber) {
        validationErrors.push('shippingAddress.phoneNumber là bắt buộc');
      }
      if (!shippingAddress.specificAddress) {
        validationErrors.push('shippingAddress.specificAddress là bắt buộc');
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: validationErrors
      });
    }

    // Validate payment method
    const validPaymentMethods = ['CASH', 'BANK_TRANSFER', 'COD', 'MIXED'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod không hợp lệ. Các giá trị hợp lệ: ${validPaymentMethods.join(', ')}`
      });
    }

    // Kiểm tra customer tồn tại
    const customer = await db.Account.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng với ID: ' + customerId
      });
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemErrors = [];
      
      const productId = item.productId || item.product;
      
      if (!productId) {
        itemErrors.push('product/productId là bắt buộc');
      } else if (!Number.isInteger(parseInt(productId)) || parseInt(productId) <= 0) {
        itemErrors.push('product/productId phải là số nguyên dương');
      }
      
      if (!item.quantity || !Number.isInteger(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
        itemErrors.push('quantity phải là số nguyên dương');
      }
      
      if (item.price === undefined || item.price === null || parseFloat(item.price) <= 0) {
        itemErrors.push('price phải là số dương');
      }
      
      if (!item.variant) {
        itemErrors.push('variant là bắt buộc');
      } else {
        if (!item.variant.colorId || !Number.isInteger(parseInt(item.variant.colorId)) || parseInt(item.variant.colorId) <= 0) {
          itemErrors.push('variant.colorId phải là số nguyên dương');
        }
        if (!item.variant.sizeId || !Number.isInteger(parseInt(item.variant.sizeId)) || parseInt(item.variant.sizeId) <= 0) {
          itemErrors.push('variant.sizeId phải là số nguyên dương');
        }
      }
      
      if (itemErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Lỗi trong item[${i}]`,
          errors: itemErrors
        });
      }
    }

    // Kiểm tra và validate stock trước khi tạo đơn hàng
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productId = item.productId || item.product;

      const product = await db.Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${productId} trong item[${i}]`
        });
      }

      let variant;
      
      // Handle different variant structures
      if (item.productVariantId) {
        // Direct variant ID provided
        variant = await db.ProductVariant.findOne({
          where: {
            id: item.productVariantId,
            productId: productId
          }
        });
      } else if (item.variant && item.variant.colorId && item.variant.sizeId) {
        // Variant specified by colorId and sizeId
        variant = await db.ProductVariant.findOne({
          where: {
            productId: productId,
            colorId: item.variant.colorId,
            sizeId: item.variant.sizeId
          }
        });
      }

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể sản phẩm cho sản phẩm "${product.name}" với colorId: ${item.variant?.colorId}, sizeId: ${item.variant?.sizeId} trong item[${i}]`
        });
      }

      // Store the variant ID for later use
      item.resolvedVariantId = variant.id;

      // Kiểm tra tồn kho
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm "${product.name}" trong item[${i}]. Tồn kho hiện tại: ${variant.stock}, yêu cầu: ${item.quantity}`
        });
      }
    }

    // Tạo đơn hàng với shipping address được lưu trong các field riêng biệt
    const orderData = {
      customerId,
      staffId: req.account ? req.account.id : null,
      voucherId: voucherId || null,
      subTotal,
      discount: discount || 0,
      total,
      shippingName: shippingAddress.name,
      shippingPhoneNumber: shippingAddress.phoneNumber,
      shippingProvinceId: shippingAddress.provinceId || null,
      shippingDistrictId: shippingAddress.districtId || null,
      shippingWardId: shippingAddress.wardId || null,
      shippingSpecificAddress: shippingAddress.specificAddress,
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'CHO_XAC_NHAN'
    };

    // Add custom orderId if provided
    if (orderId) {
      orderData.code = orderId;
    }

    const newOrder = await db.Order.create(orderData);

    // Tạo order items
    const orderItems = [];
    for (const item of items) {
      const orderItem = await db.OrderItem.create({
        orderId: newOrder.id,
        variantId: item.resolvedVariantId || item.productVariantId,
        quantity: item.quantity,
        price: item.price
      });
      orderItems.push(orderItem);
    }

    // Cập nhật stock sau khi tạo đơn hàng thành công
    await updateProductStock(items, 1);

    // Lấy đơn hàng với đầy đủ thông tin
    const populatedOrder = await db.Order.findByPk(newOrder.id, {
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => `${err.path}: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: 'Lỗi validation dữ liệu',
        errors: validationErrors
      });
    }
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Mã đơn hàng đã tồn tại',
        error: 'Duplicate order code'
      });
    }
    
    // Handle foreign key constraint errors
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu tham chiếu không hợp lệ',
        error: 'Foreign key constraint error'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn hàng
 * @route GET /api/orders
 * @access Private/Admin
 */
export const getOrders = async (req, res) => {
  try {
    const { 
      customerId, 
      orderStatus, 
      paymentStatus, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereConditions = {};
    
    if (customerId) {
      whereConditions.customerId = customerId;
    }
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus;
    }
    
    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus;
    }
    
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) {
        whereConditions.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereConditions.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    if (search) {
      whereConditions.code = { [Op.like]: `%${search}%` };
    }

    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết đơn hàng
 * @route GET /api/orders/:id
 * @access Private
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật đơn hàng
 * @route PUT /api/orders/:id
 * @access Private/Admin
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, shippingAddress } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const order = await db.Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Cập nhật thông tin
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (shippingAddress) {
      order.shippingName = shippingAddress.name;
      order.shippingPhoneNumber = shippingAddress.phoneNumber;
      order.shippingProvinceId = shippingAddress.provinceId || null;
      order.shippingDistrictId = shippingAddress.districtId || null;
      order.shippingWardId = shippingAddress.wardId || null;
      order.shippingSpecificAddress = shippingAddress.specificAddress;
    }

    await order.save();

    // Lấy đơn hàng với đầy đủ thông tin sau khi cập nhật
    const updatedOrder = await db.Order.findByPk(id, {
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật đơn hàng',
      error: error.message
    });
  }
};

/**
 * Hủy đơn hàng
 * @route DELETE /api/orders/:id
 * @access Private
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const order = await db.Order.findByPk(id, {
      include: [
        {
          model: db.OrderItem,
          as: 'items'
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.orderStatus === 'DA_HUY') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được hủy trước đó'
      });
    }

    if (order.orderStatus === 'HOAN_THANH') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng đã hoàn thành'
      });
    }

    // Hoàn trả stock
    const items = order.items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));
    await updateProductStock(items, -1);

    // Cập nhật trạng thái đơn hàng
    order.orderStatus = 'DA_HUY';
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng
 * @route PATCH /api/orders/:id/status
 * @access Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, status } = req.body;
    
    // Accept both 'orderStatus' and 'status' field names
    const statusToUpdate = orderStatus || status;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    if (!statusToUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái đơn hàng (orderStatus hoặc status)'
      });
    }

    const validStatuses = ['CHO_XAC_NHAN', 'CHO_GIAO_HANG', 'DANG_VAN_CHUYEN', 'DA_GIAO_HANG', 'HOAN_THANH', 'DA_HUY'];
    if (!validStatuses.includes(statusToUpdate)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    const order = await db.Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    order.orderStatus = statusToUpdate;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy đơn hàng của tôi
 * @route GET /api/orders/my-orders
 * @access Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const { orderStatus, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {
      customerId: req.account.id
    };
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus;
    }

    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng của tôi thành công',
      data: {
        orders,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy đơn hàng theo user ID
 * @route GET /api/orders/user/:userId
 * @access Private/Admin
 */
export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { orderStatus, page = 1, limit = 10 } = req.query;
    
    if (!Number.isInteger(parseInt(userId)) || parseInt(userId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereConditions = {
      customerId: userId
    };
    
    if (orderStatus) {
      whereConditions.orderStatus = orderStatus;
    }

    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng theo user thành công',
      data: {
        orders,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Tạo đơn hàng POS
 * @route POST /api/orders/pos
 * @access Private/Admin
 */
export const createPOSOrder = async (req, res) => {
  try {
    const { 
      orderId,
      customer,
      customerId, 
      items, 
      voucherId, 
      voucher,
      subTotal, 
      discount, 
      total, 
      shippingAddress,
      paymentMethod,
      orderStatus
    } = req.body;

    if (!items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: items, subTotal, total, paymentMethod'
      });
    }

    // Determine customer ID
    let finalCustomerId = customerId;
    
    // If customer is provided as a string (name) and no customerId, create or find guest customer
    if (customer && typeof customer === 'string' && !customerId) {
      // Find or create a guest customer account
      let guestCustomer = await db.Account.findOne({
        where: { 
          email: 'guest@pos.local',
          role: 'CUSTOMER'
        }
      });
      
      if (!guestCustomer) {
        guestCustomer = await db.Account.create({
          fullName: 'Khách hàng tại quầy',
          email: 'guest@pos.local',
          phoneNumber: '0000000000',
          password: 'defaultpassword',
          role: 'CUSTOMER',
          status: 'HOAT_DONG'
        });
      }
      
      finalCustomerId = guestCustomer.id;
    } else if (customerId) {
      // Validate customer exists
      const customerRecord = await db.Account.findByPk(customerId);
      if (!customerRecord) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng'
        });
      }
    } else {
      // No customer provided, use default guest
      let guestCustomer = await db.Account.findOne({
        where: { 
          email: 'guest@pos.local',
          role: 'CUSTOMER'
        }
      });
      
      if (!guestCustomer) {
        guestCustomer = await db.Account.create({
          fullName: 'Khách hàng tại quầy',
          email: 'guest@pos.local',
          phoneNumber: '0000000000',
          password: 'defaultpassword',
          role: 'CUSTOMER',
          status: 'HOAT_DONG'
        });
      }
      
      finalCustomerId = guestCustomer.id;
    }

    // Process and validate items
    const processedItems = [];
    for (const item of items) {
      // Convert product ID to integer
      const productId = parseInt(item.product);
      if (!productId || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: `ID sản phẩm không hợp lệ: ${item.product}`
        });
      }

      let variantId = item.productVariantId || item.variantId;
      
      // If no variant ID provided, try to find variant by product, color, and size
      if (!variantId && item.variant && item.variant.colorId && item.variant.sizeId) {
        const variant = await db.ProductVariant.findOne({
          where: {
            productId: productId,
            colorId: parseInt(item.variant.colorId),
            sizeId: parseInt(item.variant.sizeId)
          }
        });
        
        if (variant) {
          variantId = variant.id;
        }
      }
      
      // If still no variant ID and we have empty color/size IDs, try to find a default variant
      if (!variantId && item.variant && (!item.variant.colorId || !item.variant.sizeId)) {
        const variant = await db.ProductVariant.findOne({
          where: {
            productId: productId
          },
          limit: 1
        });
        
        if (variant) {
          variantId = variant.id;
        }
      }
      
      if (!variantId) {
        return res.status(400).json({
          success: false,
          message: `Không thể xác định biến thể cho sản phẩm ${productId}`
        });
      }

      // Validate variant exists and get stock info
      const variant = await db.ProductVariant.findOne({
        where: {
          id: variantId,
          productId: productId
        }
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể sản phẩm`
        });
      }

      // Check stock (use 'stock' field from ProductVariant model)
      const availableStock = variant.stock || variant.quantity || 0;
      if (availableStock < item.quantity) {
        const product = await db.Product.findByPk(productId);
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm ${product?.name || 'Unknown'}. Tồn kho hiện tại: ${availableStock}, yêu cầu: ${item.quantity}`
        });
      }

      processedItems.push({
        productId: productId,
        variantId: variantId,
        quantity: item.quantity,
        price: item.price,
        variant: variant
      });
    }

    // Handle voucher
    let finalVoucherId = voucherId;
    if (voucher && !voucherId) {
      // Handle voucher as either ID (number) or code (string)
      if (typeof voucher === 'number') {
        // If voucher is a number, treat it as voucher ID
        finalVoucherId = voucher;
      } else if (typeof voucher === 'string' && voucher.trim() !== '') {
        // If voucher is a string, treat it as voucher code
        const voucherRecord = await db.Voucher.findOne({
          where: { code: voucher.trim() }
        });
        if (voucherRecord) {
          finalVoucherId = voucherRecord.id;
        }
      }
    }

    // Create order data
    const orderData = {
      code: orderId || undefined, // Let the hook generate if not provided
      customerId: finalCustomerId,
      staffId: req.account?.id || null, // Handle case when no auth middleware
      voucherId: finalVoucherId || null,
      subTotal,
      discount: discount || 0,
      total,
      paymentMethod,
      paymentStatus: 'PAID', // POS orders are immediately paid
      orderStatus: orderStatus || 'HOAN_THANH'
    };

    // Handle shipping address if provided
    if (shippingAddress) {
      orderData.shippingName = shippingAddress.name;
      orderData.shippingPhoneNumber = shippingAddress.phoneNumber;
      orderData.shippingProvinceId = shippingAddress.provinceId;
      orderData.shippingDistrictId = shippingAddress.districtId;
      orderData.shippingWardId = shippingAddress.wardId;
      orderData.shippingSpecificAddress = shippingAddress.specificAddress;
    }

    // Tạo đơn hàng POS
    const newOrder = await db.Order.create(orderData);

    // Tạo order items với field name đúng
    for (const item of processedItems) {
      await db.OrderItem.create({
        orderId: newOrder.id,
        variantId: item.variantId, // Use correct field name
        quantity: item.quantity,
        price: item.price
      });
    }

    // Cập nhật stock
    for (const item of processedItems) {
      const variant = item.variant;
      const currentStock = variant.stock || variant.quantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      
      // Update using the correct field name
      if (variant.stock !== undefined) {
        await variant.update({ stock: newStock });
      } else if (variant.quantity !== undefined) {
        await variant.update({ quantity: newStock });
      }
    }

    // Lấy đơn hàng với đầy đủ thông tin
    const populatedOrder = await db.Order.findByPk(newOrder.id, {
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'name', 'type', 'value']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                {
                  model: db.Product,
                  as: 'product',
                  attributes: ['id', 'code', 'name', 'description', 'weight', 'status'],
                  include: [
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Material, as: 'material', attributes: ['id', 'name'] }
                  ]
                },
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { 
                  model: db.ProductVariantImage, 
                  as: 'images', 
                  attributes: ['id', 'imageUrl'] 
                }
              ]
            }
          ]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng POS thành công',
      data: populatedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng POS',
      error: error.message
    });
  }
}; 