import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const Service = sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: 'services',
    timestamps: false,
});

export default Service;
