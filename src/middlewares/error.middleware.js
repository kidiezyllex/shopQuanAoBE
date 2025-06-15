/**
 * Handle 404 errors for routes that don't exist
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi',
    data: {},
    errors: process.env.NODE_ENV === 'production' ? {} : {
      stack: err.stack
    }
  });
};