/**
 * Utility functions for timezone conversion
 * Vietnam timezone: UTC+7
 */

/**
 * Chuyển đổi thời gian từ Vietnam timezone sang UTC để lưu vào database
 * Giữ nguyên thời gian số mà người dùng nhập vào
 * @param {string} dateStr - Date string from client 
 * @returns {Date} - Date object preserving the exact time numbers
 */
export const convertVietnamToUTC = (dateStr) => {
  // Nếu không có timezone info, thêm 'Z' để giữ nguyên thời gian số
  if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

/**
 * Chuyển đổi thời gian từ UTC về Vietnam time cho response
 * Trả về nguyên date object mà không chuyển đổi
 * @param {Date} date - Date object from database
 * @returns {Date} - Same date object
 */
export const convertUTCToVietnam = (date) => {
  return date;
};

/**
 * Chuyển đổi object promotion từ UTC sang Vietnam time
 * @param {Object} promotion - Promotion object from database
 * @returns {Object} - Promotion object with Vietnam time
 */
export const convertPromotionToVietnamTime = (promotion) => {
  return {
    ...promotion.toJSON(),
    startDate: convertUTCToVietnam(promotion.startDate),
    endDate: convertUTCToVietnam(promotion.endDate),
    createdAt: convertUTCToVietnam(promotion.createdAt),
    updatedAt: convertUTCToVietnam(promotion.updatedAt)
  };
}; 