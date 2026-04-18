const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Expense = sequelize.define('Expense', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },

  desc: {
    type: DataTypes.STRING,
    allowNull: false
  },

  category: {
    type: DataTypes.ENUM('Food', 'Rent', 'Travel', 'Bills'),
    allowNull: false
  }

}, {
  timestamps: true
});

module.exports = Expense;