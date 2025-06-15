import { db } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Tạo thông báo mới
 * @route POST /api/notifications
 * @access Private/Admin
 */
export const createNotification = async (req, res) => {
  try {
    const { type, title, message, accountId } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: type, title, message'
      });
    }

    // Kiểm tra account tồn tại nếu có accountId
    if (accountId) {
      if (!Number.isInteger(parseInt(accountId)) || parseInt(accountId) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'ID tài khoản không hợp lệ'
        });
      }

      const account = await db.Account.findByPk(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản'
        });
      }
    }

    const newNotification = await db.Notification.create({
      type,
      title,
      message,
      accountId: accountId || null,
      isRead: false
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: newNotification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách thông báo
 * @route GET /api/notifications
 * @access Private/Admin
 */
export const getNotifications = async (req, res) => {
  try {
    const { type, accountId, isRead, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (accountId) {
      whereConditions.accountId = accountId;
    }
    
    if (isRead !== undefined) {
      whereConditions.isRead = isRead === 'true';
    }
    
    const { count, rows: notifications } = await db.Notification.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: db.Account,
          as: 'account',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        notifications,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết thông báo
 * @route GET /api/notifications/:id
 * @access Private/Admin
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await db.Notification.findByPk(id, {
      include: [
        {
          model: db.Account,
          as: 'account',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thông báo',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông báo
 * @route PUT /api/notifications/:id
 * @access Private/Admin
 */
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, isRead } = req.body;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await db.Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Cập nhật thông tin
    if (title) notification.title = title;
    if (message) notification.message = message;
    if (isRead !== undefined) notification.isRead = isRead;
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
};

/**
 * Xóa thông báo
 * @route DELETE /api/notifications/:id
 * @access Private/Admin
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await db.Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    await notification.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thông báo',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo
 * @route POST /api/notifications/:id/send
 * @access Private/Admin
 */
export const sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await db.Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    // Thực hiện logic gửi thông báo ở đây (push notification, email, etc.)
    // Hiện tại chỉ cập nhật trạng thái
    
    return res.status(200).json({
      success: true,
      message: 'Gửi thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy thông báo của người dùng
 * @route GET /api/notifications/my-notifications
 * @access Private
 */
export const getUserNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {
      accountId: req.account.id
    };
    
    if (isRead !== undefined) {
      whereConditions.isRead = isRead === 'true';
    }
    
    const { count, rows: notifications } = await db.Notification.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo của tôi thành công',
      data: {
        notifications,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo cho tất cả khách hàng
 * @route POST /api/notifications/send-to-all-customers
 * @access Private/Admin
 */
export const sendNotificationToAllCustomers = async (req, res) => {
  try {
    const { type, title, message } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: type, title, message'
      });
    }
    
    // Lấy tất cả khách hàng
    const customers = await db.Account.findAll({
      where: { role: 'CUSTOMER' },
      attributes: ['id']
    });
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng nào'
      });
    }
    
    // Tạo thông báo cho từng khách hàng
    const notifications = customers.map(customer => ({
      type,
      title,
      message,
      accountId: customer.id,
      isRead: false
    }));
    
    await db.Notification.bulkCreate(notifications);
    
    return res.status(201).json({
      success: true,
      message: `Đã gửi thông báo cho ${customers.length} khách hàng`,
      data: {
        notificationsSent: customers.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

/**
 * Đánh dấu thông báo đã đọc
 * @route PATCH /api/notifications/:id/mark-read
 * @access Private
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await db.Notification.findOne({
      where: {
        id,
        accountId: req.account.id
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đánh dấu thông báo đã đọc thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh dấu thông báo',
      error: error.message
    });
  }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 * @route PATCH /api/notifications/mark-all-read
 * @access Private
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await db.Notification.update(
      { isRead: true },
      {
        where: {
          accountId: req.account.id,
          isRead: false
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Đánh dấu tất cả thông báo đã đọc thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đánh dấu thông báo',
      error: error.message
    });
  }
}; 