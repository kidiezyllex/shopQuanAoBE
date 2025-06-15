'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductVariantImage extends Model {
    static associate(models) {
      ProductVariantImage.belongsTo(models.ProductVariant, {
        foreignKey: 'variantId',
        as: 'variant'
      });
    }
  }
  
  ProductVariantImage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product_variants',
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProductVariantImage',
    tableName: 'product_variant_images',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  return ProductVariantImage;
}; 