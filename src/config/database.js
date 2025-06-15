import dotenv from 'dotenv';
import db from '../sequelize-models/index.cjs';

dotenv.config();

export const jwtSecret = "kidiezyllex.1111";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";

export const connectDB = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('MySQL Connected successfully');
  } catch (error) {
    console.error('Unable to connect to MySQL database:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await db.sequelize.close();
    console.log('MySQL Disconnected');
  } catch (error) {
    console.error(`Error disconnecting from MySQL: ${error.message}`);
  }
};

export { db };
export default db; 