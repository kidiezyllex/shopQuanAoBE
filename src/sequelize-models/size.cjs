'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Size extends Model {
    static associate(models) {
      Size.hasMany(models.ProductVariant, {
        foreignKey: 'sizeId',
        as: 'variants'
      });
    }
  }
  
  Size.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    value: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('HOAT_DONG', 'INACTIVE'),
      defaultValue: 'HOAT_DONG'
    }
  }, {
    sequelize,
    modelName: 'Size',
    tableName: 'sizes',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  return Size;
}; 