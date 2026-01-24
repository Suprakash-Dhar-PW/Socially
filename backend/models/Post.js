const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  media_type: {
    type: DataTypes.ENUM('text', 'image', 'video'),
    defaultValue: 'text',
  },
  category: {
    type: DataTypes.ENUM('career', 'placement', 'opportunity', 'general'),
    defaultValue: 'general',
  },
}, {
  timestamps: true,
  tableName: 'posts',
});

module.exports = Post;
