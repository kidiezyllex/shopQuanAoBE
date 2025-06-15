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
      type: DataTypes.ENUM('HOAT_DONG', 'KHONG_HOAT_DONG'),
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
          const count = await Product.count();
          product.code = `PRD${(count + 1).toString().padStart(6, '0')}`;
        }
      }
    }
  });
  
  return Product;
}; 