'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Material extends Model {
    static associate(models) {
      Material.hasMany(models.Product, {
        foreignKey: 'materialId',
        as: 'products'
      });
    }
  }
  
  Material.init({
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
    modelName: 'Material',
    tableName: 'materials',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  return Material;
}; 