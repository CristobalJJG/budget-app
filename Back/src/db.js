import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const databaseName = process.env.DB_DATABASE || process.env.DB_NAME;
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;
const databaseHost = process.env.DB_HOST || 'localhost';
const databasePort = process.env.DB_PORT || 3306;

if (!databaseName) {
  throw new Error('Database name is required. Please set DB_DATABASE or DB_NAME environment variable.');
}

if (!databaseUser) {
  throw new Error('Database user is required. Please set DB_USER environment variable.');
}

if (!databasePassword) {
  throw new Error('Database password is required. Please set DB_PASSWORD environment variable.');
}

export const sequelize = new Sequelize(
  databaseName,
  databaseUser,
  databasePassword,
  {
    host: databaseHost,
    port: databasePort,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000
    },
    retry: {
      max: 3
    }
  }
);

export const connectDB = async () => {
  const maxAttempts = 5;
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to connect to the target database
      await sequelize.authenticate();
      console.log(`✅ Connected to MariaDB database "${databaseName}" via Sequelize`);
      return;
    } catch (error) {
      // If database doesn't exist, create it
      if (error.original && (error.original.code === 'ER_BAD_DB_ERROR' || error.original.code === 'ER_NO_DB_ERROR')) {
        console.log(`📦 Database "${databaseName}" does not exist. Creating it...`);

        const adminSequelize = new Sequelize(
          null, // No database selected
          databaseUser,
          databasePassword,
          {
            host: databaseHost,
            port: databasePort,
            dialect: 'mysql',
            logging: false,
            pool: { max: 2, min: 0 }
          }
        );

        try {
          await adminSequelize.authenticate();
          await adminSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
          console.log(`✅ Database "${databaseName}" created successfully`);
          await adminSequelize.close();

          // Now connect to the newly created database
          await sequelize.authenticate();
          console.log(`✅ Connected to MariaDB database "${databaseName}" via Sequelize`);
          return;
        } catch (createError) {
          console.error('❌ Failed to create database:', createError);
          throw createError;
        }
      }

      console.error(`❌ Connection attempt ${attempt} failed:`, error.message || error);
      if (attempt < maxAttempts) {
        const backoff = 2000 * attempt;
        console.log(`⏳ Reintentando en ${backoff}ms...`);
        await wait(backoff);
      } else {
        console.error('❌ Máximo de intentos alcanzado.');
        throw error;
      }
    }
  }
};
