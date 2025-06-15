/**
 * Middleware kiểm tra quyền admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const authorizeAdmin = (req, res, next) => {
  try {
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        data: null,
      });
    }

    if (req.account.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        data: null,
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực quyền',
      data: null,
    });
  }
};

/**
 * Middleware kiểm tra quyền nhân viên hoặc admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const authorizeStaffOrAdmin = (req, res, next) => {
  try {
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        data: null,
      });
    }

    if (req.account.role !== 'ADMIN' && req.account.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ nhân viên hoặc admin mới có quyền thực hiện hành động này',
        data: null,
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực quyền',
      data: null,
    });
  }
};

/**
 * Middleware kiểm tra quyền khách hàng
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const authorizeCustomer = (req, res, next) => {
  try {
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        data: null,
      });
    }

    if (req.account.role !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ khách hàng mới có quyền thực hiện hành động này',
        data: null,
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực quyền',
      data: null,
    });
  }
}; 