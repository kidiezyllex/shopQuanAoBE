export const validateOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return 'Danh sách sản phẩm không hợp lệ';
  }

  if (items.length === 0) {
    return 'Đơn hàng phải có ít nhất một sản phẩm';
  }

  for (const item of items) {
    if (!item.product || !item.quantity) {
      return 'Thông tin sản phẩm không đầy đủ';
    }

    if (item.quantity <= 0) {
      return 'Số lượng sản phẩm phải lớn hơn 0';
    }
  }

  return null;
};

/**
 * @param {object} orderData 
 * @returns {object} 
 * @throws {Error} 
 */
export const validateOrder = (orderData) => {
  if (!orderData) {
    throw new Error('Dữ liệu đơn hàng không được để trống');
  }

  if (orderData.items) {
    const itemsError = validateOrderItems(orderData.items);
    if (itemsError) {
      throw new Error(itemsError);
    }
  }

  return {
    items: orderData.items || [],
    customer: orderData.customer,
    status: orderData.status || 'PENDING',
    note: orderData.note,
    subtotal: orderData.subtotal || 0,
    discount: orderData.discount || 0,
    tax: orderData.tax || 0,
    totalAmount: orderData.totalAmount || 0,
    paidAmount: orderData.paidAmount || 0
  };
};

/**
 * @param {object} itemData 
 * @returns {object} 
 * @throws {Error} 
 */
export const validateOrderItem = (itemData) => {
  if (!itemData) {
    throw new Error('Dữ liệu sản phẩm không được để trống');
  }

  if (!itemData.productId) {
    throw new Error('ID sản phẩm không được để trống');
  }

  if (!itemData.variantId) {
    throw new Error('ID biến thể sản phẩm không được để trống');
  }

  if (!itemData.quantity || isNaN(itemData.quantity) || itemData.quantity <= 0) {
    throw new Error('Số lượng sản phẩm phải lớn hơn 0');
  }

  return {
    productId: itemData.productId,
    variantId: itemData.variantId,
    quantity: parseInt(itemData.quantity)
  };
};

/**
 * @param {object} paymentData 
 * @returns {object} 
 * @throws {Error} 
 */
export const validatePayment = (paymentData) => {
  if (!paymentData) {
    throw new Error('Dữ liệu thanh toán không được để trống');
  }

  if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
    throw new Error('Số tiền thanh toán phải lớn hơn 0');
  }

  if (!paymentData.method) {
    throw new Error('Phương thức thanh toán không được để trống');
  }

  const validMethods = ['CASH', 'CARD', 'BANKING', 'MOMO', 'ZALOPAY', 'OTHER'];
  if (!validMethods.includes(paymentData.method)) {
    throw new Error('Phương thức thanh toán không hợp lệ');
  }

  return {
    amount: parseFloat(paymentData.amount),
    method: paymentData.method,
    note: paymentData.note
  };
};

/**
 * @param {object} accountData 
 * @returns {object} 
 * @throws {Error} 
 */
export const validateAccount = (accountData) => {
    if (!accountData) {
        throw new Error('Account data is required.');
    }

    if (!accountData.fullName || accountData.fullName.trim() === '') {
        throw new Error('Full name is required.');
    }

    if (!accountData.email || accountData.email.trim() === '') {
        throw new Error('Email is required.');
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(accountData.email)) {
        throw new Error('Invalid email format.');
    }

    if (accountData.phoneNumber) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(accountData.phoneNumber)) {
            throw new Error('Invalid phone number format (must be 10 digits).');
        }
    }

    if (!accountData.password || accountData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }

    return accountData;
};

export const validateAddress = (addressData) => {
  if (!addressData) {
    throw new Error('Dữ liệu địa chỉ không được để trống');
  }

  if (!addressData.receiverName || addressData.receiverName.trim() === '') {
    throw new Error('Tên người nhận không được để trống');
  }

  if (!addressData.receiverPhone || addressData.receiverPhone.trim() === '') {
    throw new Error('Số điện thoại người nhận không được để trống');
  }

  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(addressData.receiverPhone)) {
    throw new Error('Số điện thoại không đúng định dạng');
  }

  if (!addressData.addressDetail || addressData.addressDetail.trim() === '') {
    throw new Error('Địa chỉ cụ thể không được để trống');
  }

  if (!addressData.province || addressData.province.trim() === '') {
    throw new Error('Tỉnh/thành phố không được để trống');
  }

  if (!addressData.district || addressData.district.trim() === '') {
    throw new Error('Quận/huyện không được để trống');
  }

  if (!addressData.ward || addressData.ward.trim() === '') {
    throw new Error('Phường/xã không được để trống');
  }

  return addressData;
};

export const validatePassword = (passwordData) => {
  if (!passwordData) {
    throw new Error('Dữ liệu mật khẩu không được để trống');
  }

  if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
    throw new Error('Mật khẩu hiện tại không được để trống');
  }

  if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  if (passwordData.confirmPassword !== passwordData.newPassword) {
    throw new Error('Xác nhận mật khẩu không khớp');
  }

  return passwordData;
};

export const validateShippingInfo = (shippingInfo) => {
  if (!shippingInfo) {
    return 'Thông tin vận chuyển không được để trống';
  }
  if (!shippingInfo.address) {
    return 'Địa chỉ không được để trống';
  }
  if (!shippingInfo.phone) {
    return 'Số điện thoại không được để trống';
  }

  return shippingInfo;
};

export const validateReturn = (returnData) => {
  if (!returnData) {
    throw new Error('Dữ liệu trả hàng không được để trống');
  }

  if (!returnData.reason || returnData.reason.trim() === '') {
    throw new Error('Lý do trả hàng không được để trống');
  }

  if (!Array.isArray(returnData.items) || returnData.items.length === 0) {
    throw new Error('Danh sách sản phẩm trả không hợp lệ');
  }

  for (const item of returnData.items) {
    if (!item.product) {
      throw new Error('ID sản phẩm không được để trống');
    }
    
    if (!item.variant) {
      throw new Error('ID biến thể không được để trống');
    }
    
    if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
      throw new Error('Số lượng sản phẩm phải lớn hơn 0');
    }
  }

  return returnData;
};

export const validateVoucher = (voucherData) => {
  if (!voucherData) {
    throw new Error('Dữ liệu voucher không được để trống');
  }

  if (!voucherData.code || voucherData.code.trim() === '') {
    throw new Error('Mã voucher không được để trống');
  }

  if (!voucherData.name || voucherData.name.trim() === '') {
    throw new Error('Tên voucher không được để trống');
  }

  if (!voucherData.value || isNaN(voucherData.value) || voucherData.value <= 0) {
    throw new Error('Giá trị voucher phải lớn hơn 0');
  }

  if (!voucherData.type || !['PHAN_TRAM', 'TIEN_MAT'].includes(voucherData.type)) {
    throw new Error('Loại voucher không hợp lệ');
  }

  if (voucherData.type === 'PHAN_TRAM' && (voucherData.value <= 0 || voucherData.value > 100)) {
    throw new Error('Giá trị phần trăm phải nằm trong khoảng (0, 100]');
  }

  if (!voucherData.startDate || !voucherData.endDate) {
    throw new Error('Thời gian hiệu lực voucher không được để trống');
  }

  if (new Date(voucherData.startDate) >= new Date(voucherData.endDate)) {
    throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
  }

  return voucherData;
};

export const validateProductPromotion = (promotionData) => {
  if (!promotionData) {
    throw new Error('Dữ liệu khuyến mãi không được để trống');
  }

  if (!promotionData.product) {
    throw new Error('ID sản phẩm không được để trống');
  }

  if (!promotionData.promotion) {
    throw new Error('ID khuyến mãi không được để trống');
  }

  if (promotionData.startDate && promotionData.endDate) {
    if (new Date(promotionData.startDate) >= new Date(promotionData.endDate)) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }
  }

  return promotionData;
};

/**
 * Validate product data for creation
 * @param {object} productData 
 * @returns {object} 
 */
export const validateProduct = (productData) => {
  const errors = [];
  
  if (!productData) {
    throw new Error('Dữ liệu sản phẩm không được để trống');
  }

  // Validate basic product fields
  if (!productData.name || typeof productData.name !== 'string' || productData.name.trim() === '') {
    errors.push('Tên sản phẩm không được để trống');
  }
  
  if (!productData.brand) {
    errors.push('Thương hiệu không được để trống');
  }
  
  if (!productData.category) {
    errors.push('Danh mục không được để trống');
  }
  
  if (!productData.material) {
    errors.push('Chất liệu không được để trống');
  }
  
  if (!productData.description || typeof productData.description !== 'string' || productData.description.trim() === '') {
    errors.push('Mô tả sản phẩm không được để trống');
  }
  
  if (productData.weight === undefined || productData.weight === null || isNaN(Number(productData.weight)) || Number(productData.weight) < 0) {
    errors.push('Trọng lượng phải là số và không được âm');
  }
  
  if (!productData.variants || !Array.isArray(productData.variants) || productData.variants.length === 0) {
    errors.push('Sản phẩm phải có ít nhất một biến thể');
  }

  // Validate variants
  if (productData.variants && Array.isArray(productData.variants)) {
    productData.variants.forEach((variant, index) => {
      const variantErrors = validateProductVariant(variant, index + 1);
      errors.push(...variantErrors);
    });
  }

  if (errors.length > 0) {
    const error = new Error('Dữ liệu sản phẩm không hợp lệ');
    error.validationErrors = errors;
    error.receivedData = {
      name: productData.name || 'undefined',
      brand: productData.brand || 'undefined',
      category: productData.category || 'undefined',
      material: productData.material || 'undefined',
      description: productData.description || 'undefined',
      weight: productData.weight !== undefined ? productData.weight : 'undefined',
      variantsCount: productData.variants ? productData.variants.length : 0
    };
    throw error;
  }

  return productData;
};

/**
 * Validate product variant data
 * @param {object} variant 
 * @param {number} index 
 * @returns {array} Array of error messages
 */
export const validateProductVariant = (variant, index) => {
  const errors = [];
  
  if (!variant.colorId) {
    errors.push(`Biến thể ${index}: Thiếu colorId`);
  }
  
  if (!variant.sizeId) {
    errors.push(`Biến thể ${index}: Thiếu sizeId`);
  }
  
  if (!variant.price || isNaN(Number(variant.price)) || Number(variant.price) <= 0) {
    errors.push(`Biến thể ${index}: Giá phải là số dương`);
  }
  
  if (variant.stock !== undefined && variant.stock !== null) {
    if (isNaN(Number(variant.stock)) || Number(variant.stock) < 0) {
      errors.push(`Biến thể ${index}: Số lượng tồn kho phải là số không âm`);
    }
  }
  
  if (variant.images && !Array.isArray(variant.images)) {
    errors.push(`Biến thể ${index}: Images phải là mảng`);
  }
  
  return errors;
}; 