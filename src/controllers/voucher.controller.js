import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Tạo phiếu giảm giá mới
 * @route POST /api/vouchers
 * @access Private/Admin
 */
export const createVoucher = async (req, res) => {
  try {
    const { code, name, discountType, discountValue, quantity, startDate, endDate, minOrderValue, maxDiscount, status } = req.body;

    if (!code || !name || !discountType || discountValue === undefined || quantity === undefined || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: code, name, discountType, discountValue, quantity, startDate, endDate'
      });
    }

    const existingVoucher = await db.Voucher.findOne({ where: { code } });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã tồn tại'
      });
    }

    if (discountType === 'PERCENTAGE' && (discountValue <= 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị phần trăm phải từ 1 đến 100'
      });
    }

    if (discountType === 'FIXED_AMOUNT' && discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị cố định phải lớn hơn 0'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      });
    }

    const newVoucher = await db.Voucher.create({
      code,
      name,
      type: discountType,
      value: discountValue,
      quantity,
      startDate,
      endDate,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo phiếu giảm giá thành công',
      data: newVoucher
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã tồn tại'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu giảm giá
 * @route GET /api/vouchers
 * @access Private/Admin
 */
export const getVouchers = async (req, res) => {
  try {
    const { code, name, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    
    if (code) {
      whereConditions.code = { [Op.like]: `%${code}%` };
    }
    
    if (name) {
      whereConditions.name = { [Op.like]: `%${name}%` };
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (startDate || endDate) {
      if (startDate) {
        whereConditions.startDate = { [Op.gte]: new Date(startDate) };
      }
      
      if (endDate) {
        whereConditions.endDate = { [Op.lte]: new Date(endDate) };
      }
    }
    
    const { count, rows: vouchers } = await db.Voucher.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách phiếu giảm giá thành công',
      data: {
        vouchers,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết phiếu giảm giá
 * @route GET /api/vouchers/:id
 * @access Private/Admin
 */
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await db.Voucher.findByPk(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin phiếu giảm giá thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Cập nhật phiếu giảm giá
 * @route PUT /api/vouchers/:id
 * @access Private/Admin
 */
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, startDate, endDate, minOrderValue, maxDiscount, status } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await db.Voucher.findByPk(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
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
    
    // Cập nhật thông tin
    if (name) voucher.name = name;
    if (quantity !== undefined) voucher.quantity = quantity;
    if (startDate) voucher.startDate = startDate;
    if (endDate) voucher.endDate = endDate;
    if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) voucher.maxDiscount = maxDiscount;
    if (status) voucher.status = status;
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu giảm giá thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Xóa phiếu giảm giá
 * @route DELETE /api/vouchers/:id
 * @access Private/Admin
 */
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await db.Voucher.findByPk(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    await voucher.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa phiếu giảm giá thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Kiểm tra tính hợp lệ của voucher
 * @route POST /api/vouchers/validate
 * @access Private
 */
export const validateVoucher = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã voucher'
      });
    }
    
    const voucher = await db.Voucher.findOne({ where: { code } });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Mã voucher không tồn tại'
      });
    }
    
    // Kiểm tra trạng thái
    if (voucher.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Voucher không còn hoạt động'
      });
    }
    
    // Kiểm tra thời gian
    const now = new Date();
    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher chưa có hiệu lực'
      });
    }
    
    if (now > new Date(voucher.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết hạn'
      });
    }
    
    // Kiểm tra số lượng
    if (voucher.usedCount >= voucher.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết lượt sử dụng'
      });
    }
    
    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderValue && voucher.minOrderValue && orderValue < voucher.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Giá trị đơn hàng tối thiểu để sử dụng voucher này là ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`
      });
    }
    
    // Tính toán giá trị giảm giá
    let discountAmount = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = (orderValue * voucher.discountValue) / 100;
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else if (voucher.discountType === 'FIXED_AMOUNT') {
      discountAmount = voucher.discountValue;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Voucher hợp lệ',
      data: {
        voucher,
        discountAmount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra voucher',
      error: error.message
    });
  }
};

/**
 * Tăng số lần sử dụng voucher
 * @route POST /api/vouchers/:id/increment-usage
 * @access Private
 */
export const incrementVoucherUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await db.Voucher.findByPk(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    if (voucher.usedCount >= voucher.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết lượt sử dụng'
      });
    }
    
    voucher.usedCount += 1;
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật số lần sử dụng voucher thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật voucher',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo voucher cho tất cả người dùng
 * @route POST /api/vouchers/:id/notify
 * @access Private/Admin
 */
export const notifyVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await db.Voucher.findByPk(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    // Lấy tất cả tài khoản khách hàng
    const customers = await db.Account.findAll({
      where: { role: 'CUSTOMER' },
      attributes: ['id']
    });
    
    // Tạo thông báo cho từng khách hàng
    const notifications = customers.map(customer => ({
      accountId: customer.id,
      title: title || `Voucher mới: ${voucher.name}`,
      message: message || `Sử dụng mã ${voucher.code} để được giảm giá!`,
      type: 'VOUCHER',
      isRead: false
    }));
    
    await db.Notification.bulkCreate(notifications);
    
    return res.status(200).json({
      success: true,
      message: `Đã gửi thông báo voucher cho ${customers.length} khách hàng`,
      data: {
        voucherCode: voucher.code,
        notificationsSent: customers.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi thông báo voucher',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách voucher có thể sử dụng cho người dùng
 * @route GET /api/vouchers/available
 * @access Private
 */
export const getAvailableVouchersForUser = async (req, res) => {
  try {
    const { orderValue } = req.query;
    const now = new Date();
    
    const whereConditions = {
      status: 'ACTIVE',
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now },
      [Op.where]: db.sequelize.literal('usedCount < quantity')
    };
    
    if (orderValue) {
      whereConditions.minOrderValue = { [Op.lte]: parseFloat(orderValue) };
    }
    
    const vouchers = await db.Voucher.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']]
    });
    
    // Tính toán giá trị giảm giá cho từng voucher
    const vouchersWithDiscount = vouchers.map(voucher => {
      let discountAmount = 0;
      if (orderValue) {
        if (voucher.discountType === 'PERCENTAGE') {
          discountAmount = (parseFloat(orderValue) * voucher.discountValue) / 100;
          if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
          }
        } else if (voucher.discountType === 'FIXED_AMOUNT') {
          discountAmount = voucher.discountValue;
        }
      }
      
      return {
        ...voucher.toJSON(),
        discountAmount
      };
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher có thể sử dụng thành công',
      data: vouchersWithDiscount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
};