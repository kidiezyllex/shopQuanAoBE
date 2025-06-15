'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sizes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      value: {
        type: Sequelize.DECIMAL(4, 1),
        allowNull: false,
        unique: true
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
    await queryInterface.dropTable('sizes');
  }
}; 