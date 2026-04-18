const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const ResetPassword = sequelize.define('ResetPassword', {
  
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }

}, {
  timestamps: true
});

module.exports = ResetPassword;