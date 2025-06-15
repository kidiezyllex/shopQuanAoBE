'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      staffId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      voucherId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'vouchers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subTotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      discount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      shippingName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingPhoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingProvinceId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingDistrictId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingWardId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shippingSpecificAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentMethod: {
        type: Sequelize.ENUM('CASH', 'BANK_TRANSFER', 'COD', 'MIXED'),
        allowNull: false
      },
      paymentStatus: {
        type: Sequelize.ENUM('PENDING', 'PARTIAL_PAID', 'PAID'),
        defaultValue: 'PENDING'
      },
      orderStatus: {
        type: Sequelize.ENUM('CHO_XAC_NHAN', 'CHO_GIAO_HANG', 'DANG_VAN_CHUYEN', 'DA_GIAO_HANG', 'HOAN_THANH', 'DA_HUY'),
        defaultValue: 'CHO_XAC_NHAN'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};