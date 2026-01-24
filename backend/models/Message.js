const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // sender_id and receiver_id will be handled by associations
}, {
  timestamps: true,
  tableName: 'messages',
});

module.exports = Message;
