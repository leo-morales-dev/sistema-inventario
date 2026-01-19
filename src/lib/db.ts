import { Sequelize } from 'sequelize';
import path from 'path';

// Usamos process.cwd() para asegurar la ruta correcta en Next.js
const storagePath = path.join(process.cwd(), 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Para no llenar la consola de logs SQL
});

export default sequelize;