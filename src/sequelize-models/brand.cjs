'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    static associate(models) {
      // define association here
      Brand.hasMany(models.Product, {
        foreignKey: 'brandId',
        as: 'products'
      });
    }
  }
  
  Brand.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('HOAT_DONG', 'KHONG_HOAT_DONG'),
      defaultValue: 'HOAT_DONG'
    }
  }, {
    sequelize,
    modelName: 'Brand',
    tableName: 'brands',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  return Brand;
};