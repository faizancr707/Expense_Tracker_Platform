const { DataTypes } = require('sequelize');
const sequelize = require('../util/database'); // your DB config

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  isPremiumUser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  totalExpense: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }

}, {
  timestamps: true
});

module.exports = User;