'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Account, {
        foreignKey: 'customerId',
        as: 'customer'
      });
      Order.belongsTo(models.Account, {
        foreignKey: 'staffId',
        as: 'staff'
      });
      Order.belongsTo(models.Voucher, {
        foreignKey: 'voucherId',
        as: 'voucher'
      });
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items'
      });
    }
  }
  
  Order.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    voucherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vouchers',
        key: 'id'
      }
    },
    subTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    shippingName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingProvinceId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingDistrictId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingWardId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingSpecificAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'COD', 'MIXED'),
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PARTIAL_PAID', 'PAID'),
      defaultValue: 'PENDING'
    },
    orderStatus: {
      type: DataTypes.ENUM('CHO_XAC_NHAN', 'CHO_GIAO_HANG', 'DANG_VAN_CHUYEN', 'DA_GIAO_HANG', 'HOAN_THANH', 'DA_HUY'),
      defaultValue: 'CHO_XAC_NHAN'
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (order, options) => {
        if (!order.code) {
          const date = new Date();
          const year = date.getFullYear().toString().slice(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const count = await Order.count();
          order.code = `DH${year}${month}${(count + 1).toString().padStart(4, '0')}`;
        }
      }
    }
  });
  
  return Order;
}; 