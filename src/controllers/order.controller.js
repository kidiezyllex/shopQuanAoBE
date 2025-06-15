import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Helper function để cập nhật stock của sản phẩm
 * @param {Array} items - Danh sách items trong đơn hàng
 * @param {Number} multiplier - 1 để trừ stock, -1 để cộng stock
 */
const updateProductStock = async (items, multiplier = 1) => {
  for (const item of items) {
    if (!Number.isInteger(parseInt(item.productId)) || parseInt(item.productId) <= 0) {
      continue; // Bỏ qua item không hợp lệ
    }

    const product = await db.Product.findByPk(item.productId);
    if (!product) {
      continue; // Bỏ qua nếu không tìm thấy sản phẩm
    }

    // Tìm variant theo productVariantId
    const variant = await db.ProductVariant.findOne({
      where: {
        id: item.productVariantId,
        productId: item.productId
      }
    });

    if (variant) {
      if (multiplier === 1) {
        // Trừ stock (khi hoàn thành đơn hàng)
        if (variant.quantity >= item.quantity) {
          variant.quantity -= item.quantity;
          await variant.save();
        }
      } else {
        // Cộng stock (khi hủy đơn hàng hoặc trả hàng)
        variant.quantity += item.quantity;
        await variant.save();
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
      if (!Number.isInteger(parseInt(item.productId)) || parseInt(item.productId) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
      }

      const product = await db.Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy sản phẩm với ID: ${item.productId}`
        });
      }

      const variant = await db.ProductVariant.findOne({
        where: {
          id: item.productVariantId,
          productId: item.productId
        }
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể sản phẩm cho sản phẩm ${product.name}`
        });
      }

      // Kiểm tra tồn kho
      if (variant.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm ${product.name}. Tồn kho hiện tại: ${variant.quantity}, yêu cầu: ${item.quantity}`
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
        productId: item.productId,
        productVariantId: item.productVariantId,
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name'],
              include: [
                { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
              ]
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] }
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] }
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name'],
              include: [
                { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
              ]
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] },
                { model: db.ProductVariantImage, as: 'images', attributes: ['id', 'imageUrl'] }
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
      message: 'Lấy thông tin đơn hàng thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng',
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] }
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
      productId: item.productId,
      productVariantId: item.productVariantId,
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
    const { orderStatus } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const validStatuses = ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_GIAO', 'HOAN_THANH', 'DA_HUY'];
    if (!validStatuses.includes(orderStatus)) {
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

    order.orderStatus = orderStatus;
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] }
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
      customerId, 
      items, 
      voucherId, 
      subTotal, 
      discount, 
      total, 
      paymentMethod 
    } = req.body;

    if (!items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: items, subTotal, total, paymentMethod'
      });
    }

    // Kiểm tra customer nếu có
    if (customerId) {
      const customer = await db.Account.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khách hàng'
        });
      }
    }

    // Kiểm tra và validate stock
    for (const item of items) {
      const variant = await db.ProductVariant.findOne({
        where: {
          id: item.productVariantId,
          productId: item.productId
        }
      });

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy biến thể sản phẩm`
        });
      }

      if (variant.quantity < item.quantity) {
        const product = await db.Product.findByPk(item.productId);
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho cho sản phẩm ${product?.name || 'Unknown'}. Tồn kho hiện tại: ${variant.quantity}, yêu cầu: ${item.quantity}`
        });
      }
    }

    // Tạo đơn hàng POS
    const newOrder = await db.Order.create({
      customerId: customerId || null,
      staffId: req.account.id,
      voucherId: voucherId || null,
      subTotal,
      discount: discount || 0,
      total,
      paymentMethod,
      paymentStatus: 'COMPLETED',
      orderStatus: 'HOAN_THANH'
    });

    // Tạo order items
    for (const item of items) {
      await db.OrderItem.create({
        orderId: newOrder.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.price
      });
    }

    // Cập nhật stock
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
          attributes: ['id', 'code', 'name', 'discountType', 'discountValue']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'code', 'name']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name', 'code'] },
                { model: db.Size, as: 'size', attributes: ['id', 'value'] }
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