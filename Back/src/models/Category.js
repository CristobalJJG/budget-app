import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'Primario',
  },
}, {
  tableName: 'categories',
  timestamps: false,
});
