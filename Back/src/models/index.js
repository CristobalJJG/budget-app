import { sequelize, connectDB } from '../db.js';
import { Category } from './Category.js';
import { Transaction } from './Transaction.js';
import { User } from './User.js';
import { Service } from './Service.js';
import { ServiceRecord } from './ServiceRecord.js';

// Establecer relaciones
User.hasMany(Category, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

Transaction.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Transaction, { foreignKey: 'category_id' });

// Services relationships
User.hasMany(Service, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Service.belongsTo(User, { foreignKey: 'user_id' });

Service.hasMany(ServiceRecord, { foreignKey: 'service_id', onDelete: 'CASCADE' });
ServiceRecord.belongsTo(Service, { foreignKey: 'service_id' });

User.hasMany(ServiceRecord, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ServiceRecord.belongsTo(User, { foreignKey: 'user_id' });

export const initDB = async () => {
  await connectDB();
  await sequelize.sync({ alter: true }); // crea/actualiza tablas según modelos
  console.log('🧩 Database synced');
};

export { Category, Transaction, User, Service, ServiceRecord };
