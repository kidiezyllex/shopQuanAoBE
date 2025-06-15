'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      colorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'colors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sizeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sizes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Add unique constraint for productId, colorId, sizeId combination
    await queryInterface.addIndex('product_variants', {
      fields: ['productId', 'colorId', 'sizeId'],
      unique: true,
      name: 'unique_product_color_size'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_variants');
  }
}; 