import jwt from 'jsonwebtoken';
import { db, jwtSecret } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Không có token, từ chối truy cập',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const decoded = jwt.verify(token, jwtSecret);

      // Kiểm tra ID có phải là số nguyên hợp lệ không (MySQL sử dụng integer ID)
      if (!Number.isInteger(decoded.id) || decoded.id <= 0) {
        return res.status(401).json({
          status: false,
          message: 'Token chứa ID người dùng không hợp lệ.',
          data: null,
          errors: { token: 'Invalid user ID format in token' },
          timestamp: new Date().toISOString()
        });
      }

      const account = await db.Account.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!account) {
        return res.status(401).json({
          status: false,
          message: 'Tài khoản không tồn tại',
          data: null,
          errors: {},
          timestamp: new Date().toISOString()
        });
      }
      req.account = account;
      next();
    } catch (jwtError) {
      throw jwtError;
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: false,
        message: 'Token không hợp lệ',
        data: null,
        errors: { token: 'Invalid token' },
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Token đã hết hạn',
        data: null,
        errors: { token: 'Token expired' },
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      status: false,
      message: 'Lỗi server trong quá trình xác thực',
      data: null,
      errors: { server: error.message },
      timestamp: new Date().toISOString()
    });
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);

    // Kiểm tra ID có phải là số nguyên hợp lệ không (MySQL sử dụng integer ID)
    if (!Number.isInteger(decoded.id) || decoded.id <= 0) {
      return res.status(401).json({
        status: false,
        message: 'Token (protect) chứa ID người dùng không hợp lệ.',
        data: null,
        errors: { token: 'Invalid user ID format in token' },
        timestamp: new Date().toISOString()
      });
    }
    
    const currentAccount = await db.Account.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!currentAccount) {
      return res.status(401).json({
        status: false,
        message: 'Tài khoản của token này không còn tồn tại',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (currentAccount.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(
        currentAccount.passwordChangedAt.getTime() / 1000,
        10
      );
      
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          status: false, 
          message: 'Mật khẩu đã thay đổi gần đây! Vui lòng đăng nhập lại.',
          data: null,
          errors: {},
          timestamp: new Date().toISOString()
        });
      }
    }
    
    req.account = currentAccount;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: false,
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      status: false,
      message: 'Lỗi server trong quá trình xác thực',
      data: null,
      errors: { server: error.message },
      timestamp: new Date().toISOString()
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.account && req.account.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin mới có quyền'
    });
  }
};

export const admin = (req, res, next) => {
  if (req.account && req.account.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin mới có quyền'
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.account.role)) {
      return res.status(403).json({
        status: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

export const checkDepartmentAccess = async (req, res, next) => {
  try {
    if (req.account.role === 'ADMIN') {
      return next();
    }
    
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
}; 