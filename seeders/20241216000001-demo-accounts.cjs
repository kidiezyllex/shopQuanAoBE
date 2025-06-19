'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if accounts already exist
    const existingAccounts = await queryInterface.sequelize.query(
      `SELECT email FROM accounts WHERE email IN ('admin@gmail.com', 'customer@gmail.com')`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingAccounts.length > 0) {
      return;
    }
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const customerPassword = await bcrypt.hash('Cus123!', 10);
    
    // Get current year for code generation
    const year = new Date().getFullYear().toString().slice(-2);
    
    // Get existing account counts for code generation
    const adminCount = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM accounts WHERE role = 'ADMIN'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const customerCount = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM accounts WHERE role = 'CUSTOMER'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const adminCode = `ADM${(adminCount[0].count + 1).toString().padStart(4, '0')}${year}`;
    const customerCode = `CUS${(customerCount[0].count + 1).toString().padStart(4, '0')}${year}`;
    
    await queryInterface.bulkInsert('accounts', [
      {
        code: adminCode,
        fullName: 'Administrator',
        phoneNumber: '0987654321',
        email: 'admin@gmail.com',
        password: adminPassword,
        birthday: new Date('1990-01-01'),
        gender: true, // true for male, false for female
        avatar: null,
        role: 'ADMIN',
        citizenId: '123456789012',
        status: 'HOAT_DONG',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: customerCode,
        fullName: 'Customer User',
        phoneNumber: '0123456789',
        email: 'customer@gmail.com',
        password: customerPassword,
        birthday: new Date('1995-05-15'),
        gender: false, // false for female
        avatar: null,
        role: 'CUSTOMER',
        citizenId: '987654321098',
        status: 'HOAT_DONG',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('accounts', {
      email: ['admin@gmail.com', 'customer@gmail.com']
    }, {});
  }
}; 