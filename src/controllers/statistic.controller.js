import { db } from '../config/database.js';
import { Op } from 'sequelize';

export const getStatistics = async (req, res) => {
  try {
    const { type = 'MONTHLY', startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Tạo filter cho thời gian
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      dateFilter.createdAt = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      dateFilter.createdAt = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Lấy thống kê đơn hàng
    const orderStats = await db.Order.findAll({
      where: {
        ...dateFilter,
        orderStatus: { [Op.in]: ['HOAN_THANH'] },
        paymentStatus: { [Op.in]: ['PAID', 'PARTIAL_PAID'] }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalOrders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalRevenue'],
        [db.sequelize.fn('SUM', db.sequelize.col('subTotal')), 'totalSubTotal'],
        [db.sequelize.fn('AVG', db.sequelize.col('total')), 'averageOrderValue']
      ],
      raw: true
    });
    
    // Lấy thống kê khách hàng mới
    const customerStats = await db.Account.findAll({
      where: {
        ...dateFilter,
        role: 'CUSTOMER'
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'newCustomers']
      ],
      raw: true
    });
    
    const statistics = {
      totalOrders: parseInt(orderStats[0]?.totalOrders || 0),
      totalRevenue: parseFloat(orderStats[0]?.totalRevenue || 0),
      totalProfit: Math.round((parseFloat(orderStats[0]?.totalSubTotal || 0)) * 0.3),
      averageOrderValue: parseFloat(orderStats[0]?.averageOrderValue || 0),
      newCustomers: parseInt(customerStats[0]?.newCustomers || 0),
      type,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê thành công',
      data: {
        statistics: [statistics],
        pagination: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê',
      error: error.message
    });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const revenueData = await db.Order.findAll({
      where: {
        ...dateFilter,
        orderStatus: 'HOAN_THANH',
        paymentStatus: { [Op.in]: ['PAID', 'PARTIAL_PAID'] }
      },
      attributes: [
        [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('createdAt'), '%Y-%m'), 'period'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalOrders'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'totalRevenue']
      ],
      group: [db.sequelize.fn('DATE_FORMAT', db.sequelize.col('createdAt'), '%Y-%m')],
      order: [[db.sequelize.fn('DATE_FORMAT', db.sequelize.col('createdAt'), '%Y-%m'), 'DESC']],
      raw: true
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy báo cáo doanh thu thành công',
      data: revenueData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo doanh thu',
      error: error.message
    });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const topProducts = await db.OrderItem.findAll({
      include: [
        {
          model: db.Order,
          as: 'order',
          where: {
            ...dateFilter,
            orderStatus: 'HOAN_THANH'
          },
          attributes: []
        },
        {
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'code', 'price']
        }
      ],
      attributes: [
        'productId',
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'totalSold'],
        [db.sequelize.fn('SUM', db.sequelize.literal('quantity * price')), 'totalRevenue']
      ],
      group: ['productId'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'DESC']],
      limit: parseInt(limit),
      raw: false
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm bán chạy thành công',
      data: topProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy',
      error: error.message
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    // Tổng đơn hàng
    const totalOrders = await db.Order.count({
      where: {
        createdAt: { [Op.gte]: daysAgo }
      }
    });
    
    // Tổng doanh thu
    const totalRevenue = await db.Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: daysAgo },
        orderStatus: 'HOAN_THANH',
        paymentStatus: { [Op.in]: ['PAID', 'PARTIAL_PAID'] }
      }
    });
    
    // Tổng khách hàng mới
    const newCustomers = await db.Account.count({
      where: {
        createdAt: { [Op.gte]: daysAgo },
        role: 'CUSTOMER'
      }
    });
    
    // Tổng sản phẩm đã bán
    const totalProductsSold = await db.OrderItem.sum('quantity', {
      include: [
        {
          model: db.Order,
          as: 'order',
          where: {
            createdAt: { [Op.gte]: daysAgo },
            orderStatus: 'HOAN_THANH'
          },
          attributes: []
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy phân tích thành công',
      data: {
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue || 0,
        newCustomers: newCustomers || 0,
        totalProductsSold: totalProductsSold || 0,
        period: `${period} ngày qua`
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy phân tích',
      error: error.message
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Thống kê hôm nay
    const todayOrders = await db.Order.count({
      where: {
        createdAt: { [Op.gte]: startOfToday },
        orderStatus: 'HOAN_THANH'
      }
    });
    
    const todayRevenue = await db.Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: startOfToday },
        orderStatus: 'HOAN_THANH',
        paymentStatus: { [Op.in]: ['PAID', 'PARTIAL_PAID'] }
      }
    });
    
    // Thống kê tháng này
    const monthOrders = await db.Order.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth },
        orderStatus: 'HOAN_THANH'
      }
    });
    
    const monthRevenue = await db.Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: startOfMonth },
        orderStatus: 'HOAN_THANH',
        paymentStatus: { [Op.in]: ['PAID', 'PARTIAL_PAID'] }
      }
    });
    
    // Tổng khách hàng
    const totalCustomers = await db.Account.count({
      where: { role: 'CUSTOMER' }
    });
    
    // Tổng sản phẩm
    const totalProducts = await db.Product.count();
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê dashboard thành công',
      data: {
        today: {
          orders: todayOrders || 0,
          revenue: todayRevenue || 0
        },
        month: {
          orders: monthOrders || 0,
          revenue: monthRevenue || 0
        },
        total: {
          customers: totalCustomers || 0,
          products: totalProducts || 0
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê dashboard',
      error: error.message
    });
  }
};

// Missing function implementations - placeholder implementations
export const getStatisticById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For now, just return a placeholder response
    return res.status(200).json({
      success: true,
      message: 'Chức năng đang được phát triển',
      data: {
        id: id,
        message: 'API endpoint này đang được phát triển'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi',
      error: error.message
    });
  }
};

export const createStatistic = async (req, res) => {
  try {
    return res.status(201).json({
      success: true,
      message: 'Chức năng đang được phát triển',
      data: {
        message: 'API endpoint này đang được phát triển'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi',
      error: error.message
    });
  }
};

export const updateStatistic = async (req, res) => {
  try {
    const { id } = req.params;
    
    return res.status(200).json({
      success: true,
      message: 'Chức năng đang được phát triển',
      data: {
        id: id,
        message: 'API endpoint này đang được phát triển'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi',
      error: error.message
    });
  }
};

export const deleteStatistic = async (req, res) => {
  try {
    const { id } = req.params;
    
    return res.status(200).json({
      success: true,
      message: 'Chức năng đang được phát triển',
      data: {
        id: id,
        message: 'API endpoint này đang được phát triển'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi',
      error: error.message
    });
  }
};

export const generateDailyStatistic = async (req, res) => {
  try {
    return res.status(201).json({
      success: true,
      message: 'Chức năng đang được phát triển',
      data: {
        message: 'API endpoint này đang được phát triển'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi',
      error: error.message
    });
  }
}; 