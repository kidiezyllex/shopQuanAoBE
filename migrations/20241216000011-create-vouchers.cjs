'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vouchers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      usedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      minOrderValue: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      maxDiscount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('HOAT_DONG', 'KHONG_HOAT_DONG'),
        defaultValue: 'HOAT_DONG'
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
    await queryInterface.dropTable('vouchers');
  }
};