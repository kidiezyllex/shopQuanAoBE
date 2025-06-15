'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccountAddress extends Model {
    static associate(models) {
      AccountAddress.belongsTo(models.Account, {
        foreignKey: 'accountId',
        as: 'account'
      });
    }
  }
  
  AccountAddress.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    provinceId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    districtId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    wardId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    specificAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'AccountAddress',
    tableName: 'account_addresses',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  return AccountAddress;
}; 