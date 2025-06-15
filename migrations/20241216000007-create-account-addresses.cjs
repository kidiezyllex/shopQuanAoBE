'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('account_addresses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      accountId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'accounts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      provinceId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      districtId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      wardId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      specificAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('account_addresses');
  }
}; 