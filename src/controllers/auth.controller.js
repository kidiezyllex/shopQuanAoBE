import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, jwtSecret } from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Đăng nhập
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const account = await db.Account.findOne({ where: { email } });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }

    if (account.status === 'KHONG_HOAT_DONG') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    const isPasswordValid = await account.validatePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác'
      });
    }

    const token = jwt.sign(
      { id: account.id, role: account.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        account: {
          id: account.id,
          code: account.code,
          fullName: account.fullName,
          email: account.email,
          phoneNumber: account.phoneNumber,
          role: account.role,
          avatar: account.avatar
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập',
      error: error.message
    });
  }
};

/**
 * Đăng ký
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    const whereConditions = [{ email: email.trim() }];
    if (phoneNumber && phoneNumber.trim()) {
      whereConditions.push({ phoneNumber: phoneNumber.trim() });
    }

    const existingAccount = await db.Account.findOne({
      where: {
        [Op.or]: whereConditions
      }
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }

    const accountData = {
      fullName,
      email,
      password,
      role: 'CUSTOMER'
    };
    if (phoneNumber) {
      accountData.phoneNumber = phoneNumber;
    }

    const newAccount = await db.Account.create(accountData);

    const token = jwt.sign(
      { id: newAccount.id, role: newAccount.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        token,
        account: {
          id: newAccount.id,
          code: newAccount.code,
          fullName: newAccount.fullName,
          email: newAccount.email,
          phoneNumber: newAccount.phoneNumber,
          role: newAccount.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký tài khoản',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin tài khoản hiện tại
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentAccount = async (req, res) => {
  try {
    const account = await db.Account.findByPk(req.account.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: db.AccountAddress,
          as: 'addresses'
        }
      ]
    });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin tài khoản thành công',
      data: account
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin tài khoản',
      error: error.message
    });
  }
};

/**
 * Thay đổi mật khẩu
 * @route PUT /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const account = await db.Account.findByPk(req.account.id);

    const isPasswordValid = await account.validatePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    account.password = newPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Thay đổi mật khẩu thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thay đổi mật khẩu',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin tài khoản
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, birthday, gender, citizenId } = req.body;
    
    const account = await db.Account.findByPk(req.account.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Cập nhật thông tin
    if (fullName) account.fullName = fullName;
    if (phoneNumber) account.phoneNumber = phoneNumber;
    if (birthday) account.birthday = birthday;
    if (gender !== undefined) account.gender = gender;
    if (citizenId) account.citizenId = citizenId;

    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        id: account.id,
        code: account.code,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        birthday: account.birthday,
        gender: account.gender,
        citizenId: account.citizenId,
        role: account.role,
        avatar: account.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
};

/**
 * Thêm địa chỉ
 * @route POST /api/auth/address
 * @access Private
 */
export const addAddress = async (req, res) => {
  try {
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type } = req.body;
    
    const newAddress = await db.AccountAddress.create({
      accountId: req.account.id,
      name,
      phoneNumber,
      provinceId,
      districtId,
      wardId,
      specificAddress,
      type: type || false,
      isDefault: false
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công',
      data: newAddress
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm địa chỉ',
      error: error.message
    });
  }
};

/**
 * Cập nhật địa chỉ
 * @route PUT /api/auth/address/:addressId
 * @access Private
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type } = req.body;
    
    const address = await db.AccountAddress.findOne({
      where: {
        id: addressId,
        accountId: req.account.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Cập nhật thông tin địa chỉ
    if (name) address.name = name;
    if (phoneNumber) address.phoneNumber = phoneNumber;
    if (provinceId) address.provinceId = provinceId;
    if (districtId) address.districtId = districtId;
    if (wardId) address.wardId = wardId;
    if (specificAddress) address.specificAddress = specificAddress;
    if (type !== undefined) address.type = type;

    await address.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: address
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật địa chỉ',
      error: error.message
    });
  }
};

/**
 * Xóa địa chỉ
 * @route DELETE /api/auth/address/:addressId
 * @access Private
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const address = await db.AccountAddress.findOne({
      where: {
        id: addressId,
        accountId: req.account.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    await address.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa địa chỉ',
      error: error.message
    });
  }
};

/**
 * Đặt địa chỉ mặc định
 * @route PUT /api/auth/address/:addressId/default
 * @access Private
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    // Kiểm tra địa chỉ có tồn tại và thuộc về user không
    const address = await db.AccountAddress.findOne({
      where: {
        id: addressId,
        accountId: req.account.id
      }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Bỏ default của tất cả địa chỉ khác
    await db.AccountAddress.update(
      { isDefault: false },
      { where: { accountId: req.account.id } }
    );

    // Đặt địa chỉ này làm default
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: 'Đặt địa chỉ mặc định thành công',
      data: address
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt địa chỉ mặc định',
      error: error.message
    });
  }
}; 