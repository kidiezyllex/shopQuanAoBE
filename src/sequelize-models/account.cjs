'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      Account.hasMany(models.Order, {
        foreignKey: 'customerId',
        as: 'customerOrders'
      });
      Account.hasMany(models.Order, {
        foreignKey: 'staffId',
        as: 'staffOrders'
      });
      Account.hasMany(models.AccountAddress, {
        foreignKey: 'accountId',
        as: 'addresses'
      });
    }

    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }
  
  Account.init({
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
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gender: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('CUSTOMER', 'ADMIN'),
      defaultValue: 'CUSTOMER'
    },
    citizenId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      defaultValue: 'ACTIVE'
    }
  }, {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hooks: {
      beforeSave: async (account, options) => {
        if (account.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          account.password = await bcrypt.hash(account.password, salt);
        }
      },
      beforeCreate: async (account, options) => {
        if (!account.code) {
          const prefix = account.role === 'CUSTOMER' ? 'CUS' : 'ADM';
          const year = new Date().getFullYear().toString().slice(-2);
          
          // Generate a simple sequential code (you might want to implement counter logic)
          const count = await Account.count({ where: { role: account.role } });
          account.code = `${prefix}${(count + 1).toString().padStart(4, '0')}${year}`;
        }
      }
    }
  });
  
  return Account;
}; 