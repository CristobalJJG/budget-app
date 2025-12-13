import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { Service } from './Service.js';

export const ServiceRecord = sequelize.define('ServiceRecord', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, {
    tableName: 'service_records',
    timestamps: false,
});

ServiceRecord.belongsTo(Service, { foreignKey: 'service_id' });
Service.hasMany(ServiceRecord, { foreignKey: 'service_id' });

export default ServiceRecord;
