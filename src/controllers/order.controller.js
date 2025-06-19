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
    
    // Handle different item structures
    if (item.resolvedVariantId) {
      variantId = item.resolvedVariantId;
    } else if (item.variantId) {
      variantId = item.variantId;
    } else if (item.productVariantId) {
      variantId = item.productVariantId;
    } else {
      continue; // Skip if no variant ID found
    }

    if (!Number.isInteger(parseInt(variantId)) || parseInt(variantId) <= 0) {
      continue; // Skip invalid variant ID
    }

    // Find variant by variantId
    const variant = await db.ProductVariant.findByPk(variantId);

    if (variant) {
      // Use the correct stock field name
      const stockField = variant.stock !== undefined ? 'stock' : 'quantity';
      const currentStock = variant[stockField] || 0;
      
      if (multiplier === 1) {
        // Subtract stock (when completing order)
        if (currentStock >= item.quantity) {
          await variant.update({ [stockField]: currentStock - item.quantity });
        }
      } else {
        // Add stock (when canceling order or returns)
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

    if (!customerId || !items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: customerId, items, subTotal, total, paymentMethod'
      });
    }

    // Kiểm tra customer tồn tại
    const customer = await db.Account.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Kiểm tra và validate stock trước khi tạo đơn hàng
    for (const item of items) {
      // Handle both productId and product field names
      const productId = item.productId || item.product;
      
      if (!Number.isInteger(parseInt(productId)) || parseInt(productId) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
      }

      const product = await db.Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${productId}`
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
      } else {
        return res.status(400).json({
          success: false,
          message: 'Thông tin biến thể sản phẩm không hợp lệ. Cần cung cấp productVariantId hoặc variant với colorId và sizeId'
        });
      }

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể sản phẩm cho sản phẩm ${product.name}`
        });
      }

      // Store the variant ID for later use
      item.resolvedVariantId = variant.id;

      // Kiểm tra tồn kho
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm ${product.name}. Tồn kho hiện tại: ${variant.stock}, yêu cầu: ${item.quantity}`
        });
      }
    }

    // Tạo đơn hàng
    const newOrder = await db.Order.create({
      customerId,
      staffId: req.account ? req.account.id : null,
      voucherId: voucherId || null,
      subTotal,
      discount: discount || 0,
      total,
      shippingAddress: JSON.stringify(shippingAddress),
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'CHO_XAC_NHAN'
    });

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
    if (shippingAddress) order.shippingAddress = JSON.stringify(shippingAddress);

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
    console.error('POS Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng POS',
      error: error.message
    });
  }
}; 