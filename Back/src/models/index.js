import { sequelize, connectDB } from '../db.js';
import { Category } from './Category.js';
import { Transaction } from './Transaction.js';
import { User } from './User.js';

// Establecer relaciones
User.hasMany(Category, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

Transaction.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Transaction, { foreignKey: 'category_id' });

export const initDB = async () => {
  await connectDB();
  await sequelize.sync({ alter: true }); // crea/actualiza tablas según modelos
  console.log('🧩 Database synced');
};

export { Category, Transaction, User };
