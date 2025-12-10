import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { Category } from './Category.js';

export const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balance_after: { type: DataTypes.DECIMAL(12, 2) },
  description: { type: DataTypes.TEXT },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'transactions',
  timestamps: false,
});

// Relación N:1 → cada transaction pertenece a una categoría
Transaction.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Transaction, { foreignKey: 'category_id' });
