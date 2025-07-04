'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Brand, {
        foreignKey: 'brandId',
        as: 'brand'
      });
      Product.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category'
      });
      Product.belongsTo(models.Material, {
        foreignKey: 'materialId',
        as: 'material'
      });
      Product.hasMany(models.ProductVariant, {
        foreignKey: 'productId',
        as: 'variants'
      });
    }
  }
  
  Product.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'brands',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    materialId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'materials',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('HOAT_DONG', 'INACTIVE'),
      defaultValue: 'HOAT_DONG'
    }
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeCreate: async (product, options) => {
        if (!product.code) {
          // Find the highest existing product number
          const lastProduct = await Product.findOne({
            attributes: ['code'],
            where: {
              code: {
                [sequelize.Sequelize.Op.like]: 'PRD%'
              }
            },
            order: [['code', 'DESC']]
          });
          
          let nextNumber = 1;
          if (lastProduct && lastProduct.code) {
            const lastNumber = parseInt(lastProduct.code.replace('PRD', ''));
            nextNumber = lastNumber + 1;
          }
          
          product.code = `PRD${nextNumber.toString().padStart(6, '0')}`;
        }
      }
    }
  });
  
  return Product;
}; 