const { DataTypes } = require('sequelize');
const sequelize = require('../util/database');

const Report = sequelize.define('Report', {

  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },

  url: {
    type: DataTypes.STRING,
    allowNull: false
  }

}, {
  timestamps: true
});

module.exports = Report;