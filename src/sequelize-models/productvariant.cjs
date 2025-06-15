'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, {
        foreignKey: 'productId',
        as: 'product'
      });
      ProductVariant.belongsTo(models.Color, {
        foreignKey: 'colorId',
        as: 'color'
      });
      ProductVariant.belongsTo(models.Size, {
        foreignKey: 'sizeId',
        as: 'size'
      });
      ProductVariant.hasMany(models.ProductVariantImage, {
        foreignKey: 'variantId',
        as: 'images'
      });
      ProductVariant.hasMany(models.OrderItem, {
        foreignKey: 'variantId',
        as: 'orderItems'
      });
    }
  }
  
  ProductVariant.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    colorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'colors',
        key: 'id'
      }
    },
    sizeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sizes',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'ProductVariant',
    tableName: 'product_variants',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['productId', 'colorId', 'sizeId']
      }
    ]
  });
  
  return ProductVariant;
}; 