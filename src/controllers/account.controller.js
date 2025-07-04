import { db } from '../config/database.js';
import { Op } from 'sequelize';
import { validatePassword } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/auth.js';

export const getAllAccounts = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereConditions = {};
    
    if (role) {
      whereConditions.role = role;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows: accounts } = await db.Account.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tài khoản thành công',
      data: {
        accounts,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách tài khoản',
      error: error.message
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await db.Account.findByPk(id, {
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

export const createAccount = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, role, gender, birthday, citizenId } = req.body;
    
    const whereConditions = [];
    if (email && typeof email === 'string') {
      whereConditions.push({ email: email.trim() });
    }
    if (phoneNumber && typeof phoneNumber === 'string') {
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
    
    const newAccount = await db.Account.create({
      fullName,
      email,
      password,
      phoneNumber,
      role: role || 'CUSTOMER',
      gender,
      birthday,
      citizenId
    });
    
    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        id: newAccount.id,
        code: newAccount.code,
        fullName: newAccount.fullName,
        email: newAccount.email,
        phoneNumber: newAccount.phoneNumber,
        role: newAccount.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo tài khoản',
      error: error.message
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, gender, birthday, citizenId, avatar, status } = req.body;
    
    const account = await db.Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (email && email !== account.email) {
      const existingEmailAccount = await db.Account.findOne({ where: { email } });
      if (existingEmailAccount) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }
    
    if (phoneNumber && phoneNumber !== account.phoneNumber) {
      const existingPhoneAccount = await db.Account.findOne({ where: { phoneNumber } });
      if (existingPhoneAccount) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }
    
    if (fullName) account.fullName = fullName;
    if (email) account.email = email;
    if (phoneNumber) account.phoneNumber = phoneNumber;
    if (gender !== undefined) account.gender = gender;
    if (birthday) account.birthday = birthday;
    if (citizenId) account.citizenId = citizenId;
    if (avatar) account.avatar = avatar;
    if (status) account.status = status;
    
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: {
        id: account.id,
        code: account.code,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        role: account.role,
        status: account.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tài khoản',
      error: error.message
    });
  }
};

export const updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    const account = await db.Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    account.status = status;
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: `${status === 'ACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`,
      data: {
        id: account.id,
        status: account.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái tài khoản',
      error: error.message
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await db.Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    await account.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa tài khoản',
      error: error.message
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type } = req.body;
    
    const account = await db.Account.findByPk(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const newAddress = await db.AccountAddress.create({
      accountId: id,
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

export const updateAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type } = req.body;
    
    const address = await db.AccountAddress.findOne({
      where: {
        id: addressId,
        accountId: id
      }
    });
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
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

export const deleteAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    
    const address = await db.AccountAddress.findOne({
      where: {
        id: addressId,
        accountId: id
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

export const getProfile = async (req, res) => {
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
      message: 'Lấy thông tin profile thành công',
      data: account
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin profile',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, birthday, gender, citizenId, avatar } = req.body;
    
    const account = await db.Account.findByPk(req.account.id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (fullName) account.fullName = fullName;
    if (phoneNumber) account.phoneNumber = phoneNumber;
    if (birthday) account.birthday = birthday;
    if (gender !== undefined) account.gender = gender;
    if (citizenId) account.citizenId = citizenId;
    if (avatar) account.avatar = avatar;
    
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: {
        id: account.id,
        code: account.code,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        birthday: account.birthday,
        gender: account.gender,
        citizenId: account.citizenId,
        avatar: account.avatar,
        role: account.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật profile',
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const account = await db.Account.findByPk(req.account.id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
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