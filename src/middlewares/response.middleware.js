/**
 * Response middleware để chuẩn hóa tất cả các response theo định dạng yêu cầu
 * {
 *   status: boolean
 *   message: string
 *   data: {}
 *   errors: {}
 *   timestamp: Date
 * }
 */

const responseMiddleware = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(obj) {
    let statusCode = res.statusCode || 200;
    let isSuccess = statusCode < 400;
    const standardResponse = {
      status: Object.prototype.hasOwnProperty.call(obj, 'success') ? obj.success : isSuccess,
      message: obj.message || (isSuccess ? 'Success' : 'Error'),
      data: isSuccess ? (obj.data || (obj.message ? {} : obj)) : {},
      errors: isSuccess ? {} : (obj.errors || obj.error ? { error: obj.error } : (obj.message ? {} : obj)),
      timestamp: new Date()
    };
    
    return originalJson.call(this, standardResponse);
  };
  
  next();
};

export default responseMiddleware; 