const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define('Order', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },

  paymentId: {
    type: DataTypes.STRING,
    allowNull: false
  },

  orderId: {
    type: DataTypes.STRING,
    allowNull: false
  },

  signature: {
    type: DataTypes.STRING,
    allowNull: false
  },

  status: {
    type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
    defaultValue: 'PENDING'
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }

}, {
  timestamps: true
});

module.exports = Order;