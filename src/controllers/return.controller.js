import { db } from '../config/database.js';
import { Op } from 'sequelize';

export const createReturn = async (req, res) => {
  try {
    const { originalOrderId, customerId, items, totalRefund, reason } = req.body;
    const staffId = req.account.id;

    if (!originalOrderId || !customerId || !items || items.length === 0 || !totalRefund) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: originalOrderId, customerId, items, totalRefund'
      });
    }

    if (!Number.isInteger(parseInt(originalOrderId)) || parseInt(originalOrderId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    if (!Number.isInteger(parseInt(customerId)) || parseInt(customerId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ'
      });
    }

    const orderExists = await db.Order.findByPk(originalOrderId, {
      include: [
        {
          model: db.OrderItem,
          as: 'items'
        }
      ]
    });

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng gốc'
      });
    }

    if (orderExists.orderStatus !== 'HOAN_THANH') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được trả hàng cho đơn hàng đã hoàn thành'
      });
    }

    // Kiểm tra items hợp lệ
    for (const item of items) {
      if (!Number.isInteger(parseInt(item.productId)) || parseInt(item.productId) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
      }

      const orderItem = orderExists.items.find(
        oi => oi.productId === item.productId && oi.productVariantId === item.productVariantId
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm không tồn tại trong đơn hàng gốc: ${item.productId}`
        });
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng trả (${item.quantity}) vượt quá số lượng trong đơn hàng (${orderItem.quantity})`
        });
      }
    }

    const newReturn = await db.Return.create({
      originalOrderId,
      customerId,
      staffId,
      items: JSON.stringify(items),
      totalRefund,
      reason,
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn trả hàng thành công',
      data: newReturn
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn trả hàng',
      error: error.message
    });
  }
};

export const getReturns = async (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (customerId && Number.isInteger(parseInt(customerId)) && parseInt(customerId) > 0) {
      whereConditions.customerId = customerId;
    }
    
    const { count, rows: returns } = await db.Return.findAndCountAll({
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
          model: db.Order,
          as: 'originalOrder',
          attributes: ['id', 'code']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn trả hàng thành công',
      data: {
        returns,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn trả hàng',
      error: error.message
    });
  }
};

export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findByPk(id, {
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
          model: db.Order,
          as: 'originalOrder',
          attributes: ['id', 'code', 'total']
        }
      ]
    });
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }

    // Parse items để lấy thông tin sản phẩm
    let itemsWithProducts = [];
    if (returnOrder.items) {
      try {
        const items = JSON.parse(returnOrder.items);
        for (const item of items) {
          const product = await db.Product.findByPk(item.productId, {
            attributes: ['id', 'name', 'code', 'price']
          });
          const variant = await db.ProductVariant.findByPk(item.productVariantId, {
            include: [
              { model: db.Color, as: 'color', attributes: ['id', 'name'] },
              { model: db.Size, as: 'size', attributes: ['id', 'value'] }
            ]
          });
          
          itemsWithProducts.push({
            ...item,
            product,
            variant
          });
        }
      } catch (parseError) {
        console.error('Error parsing return items:', parseError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn trả hàng thành công',
      data: {
        ...returnOrder.toJSON(),
        itemsWithProducts
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn trả hàng',
      error: error.message
    });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findByPk(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    returnOrder.status = status;
    if (note) returnOrder.note = note;
    
    await returnOrder.save();

    // Nếu trạng thái là COMPLETED, cập nhật lại stock
    if (status === 'COMPLETED' && returnOrder.items) {
      try {
        const items = JSON.parse(returnOrder.items);
        for (const item of items) {
          const variant = await db.ProductVariant.findByPk(item.productVariantId);
          if (variant) {
            variant.quantity += item.quantity;
            await variant.save();
          }
        }
      } catch (parseError) {
        console.error('Error updating stock:', parseError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn trả hàng',
      error: error.message
    });
  }
};

export const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, totalRefund, reason } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findByPk(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }

    if (returnOrder.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật đơn trả hàng đang chờ xử lý'
      });
    }
    
    if (items) returnOrder.items = JSON.stringify(items);
    if (totalRefund !== undefined) returnOrder.totalRefund = totalRefund;
    if (reason) returnOrder.reason = reason;
    
    await returnOrder.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật đơn trả hàng',
      error: error.message
    });
  }
};

export const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findByPk(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }

    if (returnOrder.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa đơn trả hàng đã hoàn thành'
      });
    }
    
    await returnOrder.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa đơn trả hàng thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa đơn trả hàng',
      error: error.message
    });
  }
};

export const searchReturn = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }
    
    const { count, rows: returns } = await db.Return.findAndCountAll({
      include: [
        {
          model: db.Account,
          as: 'customer',
          attributes: ['id', 'fullName', 'email', 'phoneNumber'],
          where: {
            [Op.or]: [
              { fullName: { [Op.like]: `%${query}%` } },
              { email: { [Op.like]: `%${query}%` } },
              { phoneNumber: { [Op.like]: `%${query}%` } }
            ]
          }
        },
        {
          model: db.Account,
          as: 'staff',
          attributes: ['id', 'fullName']
        },
        {
          model: db.Order,
          as: 'originalOrder',
          attributes: ['id', 'code']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Tìm kiếm đơn trả hàng thành công',
      data: {
        returns,
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
      message: 'Đã xảy ra lỗi khi tìm kiếm đơn trả hàng',
      error: error.message
    });
  }
};

export const getReturnStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereConditions = {};
    
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const totalReturns = await db.Return.count({ where: whereConditions });
    const pendingReturns = await db.Return.count({ 
      where: { ...whereConditions, status: 'PENDING' }
    });
    const approvedReturns = await db.Return.count({ 
      where: { ...whereConditions, status: 'APPROVED' }
    });
    const completedReturns = await db.Return.count({ 
      where: { ...whereConditions, status: 'COMPLETED' }
    });
    const rejectedReturns = await db.Return.count({ 
      where: { ...whereConditions, status: 'REJECTED' }
    });
    
    const totalRefundAmount = await db.Return.sum('totalRefund', {
      where: { ...whereConditions, status: 'COMPLETED' }
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê đơn trả hàng thành công',
      data: {
        totalReturns,
        pendingReturns,
        approvedReturns,
        completedReturns,
        rejectedReturns,
        totalRefundAmount: totalRefundAmount || 0
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê đơn trả hàng',
      error: error.message
    });
  }
};

export const getReturnableOrders = async (req, res) => {
  try {
    const { customerId, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (!customerId || !Number.isInteger(parseInt(customerId)) || parseInt(customerId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ'
      });
    }
    
    // Lấy các đơn hàng đã hoàn thành trong vòng 30 ngày
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: {
        customerId,
        orderStatus: 'HOAN_THANH',
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'code']
            },
            {
              model: db.ProductVariant,
              as: 'productVariant',
              include: [
                { model: db.Color, as: 'color', attributes: ['id', 'name'] },
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
      message: 'Lấy danh sách đơn hàng có thể trả thành công',
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng có thể trả',
      error: error.message
    });
  }
};

export const createReturnRequest = async (req, res) => {
  try {
    const { originalOrderId, items, reason } = req.body;
    const customerId = req.account.id;

    if (!originalOrderId || !items || items.length === 0 || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: originalOrderId, items, reason'
      });
    }

    if (!Number.isInteger(parseInt(originalOrderId)) || parseInt(originalOrderId) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    const orderExists = await db.Order.findOne({
      where: {
        id: originalOrderId,
        customerId,
        orderStatus: 'HOAN_THANH'
      },
      include: [
        {
          model: db.OrderItem,
          as: 'items'
        }
      ]
    });

    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng chưa hoàn thành'
      });
    }

    // Kiểm tra thời gian trả hàng (30 ngày)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (new Date(orderExists.createdAt) < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã quá thời hạn trả hàng (30 ngày)'
      });
    }

    // Tính tổng tiền hoàn trả
    let totalRefund = 0;
    for (const item of items) {
      const orderItem = orderExists.items.find(
        oi => oi.productId === item.productId && oi.productVariantId === item.productVariantId
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm không tồn tại trong đơn hàng: ${item.productId}`
        });
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng trả vượt quá số lượng đã mua`
        });
      }

      totalRefund += orderItem.price * item.quantity;
    }

    const newReturn = await db.Return.create({
      originalOrderId,
      customerId,
      items: JSON.stringify(items),
      totalRefund,
      reason,
      status: 'PENDING'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu trả hàng thành công',
      data: newReturn
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo yêu cầu trả hàng',
      error: error.message
    });
  }
};

export const getMyReturns = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const customerId = req.account.id;
    
    const whereConditions = { customerId };
    
    if (status) {
      whereConditions.status = status;
    }
    
    const { count, rows: returns } = await db.Return.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Order,
          as: 'originalOrder',
          attributes: ['id', 'code']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn trả hàng của tôi thành công',
      data: {
        returns,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn trả hàng',
      error: error.message
    });
  }
};

export const getMyReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.account.id;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findOne({
      where: { id, customerId },
      include: [
        {
          model: db.Order,
          as: 'originalOrder',
          attributes: ['id', 'code', 'total']
        }
      ]
    });
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn trả hàng',
      error: error.message
    });
  }
};

export const cancelMyReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.account.id;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await db.Return.findOne({
      where: { id, customerId }
    });
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }

    if (returnOrder.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn trả hàng đang chờ xử lý'
      });
    }
    
    returnOrder.status = 'CANCELLED';
    await returnOrder.save();
    
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn trả hàng',
      error: error.message
    });
  }
}; 