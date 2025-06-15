import { db } from '../config/database.js';
import { Op } from 'sequelize';
import querystring from 'querystring';

export const createPayment = async (req, res) => {
  try {
    const { orderId, amount, method, bankTransferInfo, note } = req.body;

    if (!orderId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: orderId, amount, method'
      });
    }

    if (!Number.isInteger(parseInt(orderId)) || parseInt(orderId) <= 0) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải là số dương' });
    }

    const order = await db.Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (['HOAN_THANH', 'DA_HUY'].includes(order.orderStatus)) {
       return res.status(400).json({ success: false, message: `Không thể tạo thanh toán cho đơn hàng đã ${order.orderStatus}` });
    }

    const newPayment = await db.Payment.create({
      orderId,
      amount,
      method,
      bankTransferInfo: method === 'BANK_TRANSFER' ? JSON.stringify(bankTransferInfo) : null,
      status: method === 'BANK_TRANSFER' ? 'PENDING' : 'COMPLETED',
      note,
    });

    // Tính tổng số tiền đã thanh toán cho đơn hàng
    const paymentsForOrder = await db.Payment.findAll({ 
      where: { orderId, status: 'COMPLETED' }
    });
    const totalPaid = paymentsForOrder.reduce((sum, payment) => sum + payment.amount, 0);

    // Cập nhật trạng thái thanh toán của đơn hàng
    if (totalPaid >= order.total) {
      order.paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'PARTIAL_PAID';
    } else {
      order.paymentStatus = 'PENDING';
    }
    
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thanh toán thành công',
      data: newPayment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán',
      error: error.message
    });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { orderId, status, method, page = 1, limit = 10, fromDate, toDate } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereConditions = {};
    
    if (orderId) {
       if (!Number.isInteger(parseInt(orderId)) || parseInt(orderId) <= 0) {
         return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
       }
       whereConditions.orderId = orderId;
    }
    
    if (status) whereConditions.status = status;
    if (method) whereConditions.method = method;
    
    if (fromDate || toDate) {
      whereConditions.createdAt = {};
      if (fromDate) whereConditions.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereConditions.createdAt[Op.lte] = new Date(toDate);
    }

    const { count, rows: payments } = await db.Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'code', 'total'],
          include: [
            {
              model: db.Account,
              as: 'customer',
              attributes: ['id', 'fullName', 'code']
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
      message: 'Lấy danh sách thanh toán thành công',
      data: {
        payments,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    const payment = await db.Payment.findByPk(id, {
      include: [
        {
          model: db.Order,
          as: 'order',
          attributes: ['id', 'code', 'total', 'paymentStatus', 'orderStatus'],
          include: [
            {
              model: db.Account,
              as: 'customer',
              attributes: ['id', 'fullName', 'code', 'email']
            }
          ]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thanh toán thành công',
      data: payment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thanh toán',
      error: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    if (!status || !['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const payment = await db.Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    const oldStatus = payment.status;
    payment.status = status;
    if (note !== undefined) payment.note = note;

    await payment.save();

    // Cập nhật trạng thái thanh toán của đơn hàng nếu trạng thái thay đổi
    if (oldStatus !== status && (oldStatus === 'COMPLETED' || status === 'COMPLETED')) {
       const order = await db.Order.findByPk(payment.orderId);
       if(order) {
           const paymentsForOrder = await db.Payment.findAll({ 
             where: { orderId: payment.orderId, status: 'COMPLETED' }
           });
           const totalPaid = paymentsForOrder.reduce((sum, p) => sum + p.amount, 0);

           if (totalPaid >= order.total) {
             order.paymentStatus = 'PAID';
           } else if (totalPaid > 0) {
             order.paymentStatus = 'PARTIAL_PAID';
           } else {
             order.paymentStatus = 'PENDING';
           }
           await order.save();
       }
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: payment
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};

export const getPaymentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!Number.isInteger(parseInt(orderId)) || parseInt(orderId) <= 0) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    const { count, rows: payments } = await db.Payment.findAndCountAll({
      where: { orderId },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thanh toán theo đơn hàng thành công',
      data: {
        payments,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    const payment = await db.Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    if (payment.status === 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể xóa thanh toán đã hoàn thành' 
      });
    }

    await payment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa thanh toán thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thanh toán',
      error: error.message
    });
  }
};

export const createCODPayment = async (req, res) => {
  try {
    const { orderId, amount, note } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: orderId, amount'
      });
    }

    if (!Number.isInteger(parseInt(orderId)) || parseInt(orderId) <= 0) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    const order = await db.Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.orderStatus !== 'HOAN_THANH') {
      return res.status(400).json({ 
        success: false, 
        message: 'Chỉ có thể tạo thanh toán COD cho đơn hàng đã hoàn thành' 
      });
    }

    const newPayment = await db.Payment.create({
      orderId,
      amount,
      method: 'COD',
      status: 'COMPLETED',
      note: note || 'Thanh toán COD khi giao hàng',
    });

    // Cập nhật trạng thái thanh toán của đơn hàng
    const paymentsForOrder = await db.Payment.findAll({ 
      where: { orderId, status: 'COMPLETED' }
    });
    const totalPaid = paymentsForOrder.reduce((sum, payment) => sum + payment.amount, 0);

    if (totalPaid >= order.total) {
      order.paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'PARTIAL_PAID';
    }
    
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thanh toán COD thành công',
      data: newPayment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán COD',
      error: error.message
    });
  }
};
