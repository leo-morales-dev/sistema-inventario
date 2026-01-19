import { DataTypes, Model } from 'sequelize';
import sequelize from '../lib/db';

class Product extends Model {
  declare id: number;
  declare code: string;
  declare short_code: string;
  declare description: string;
  declare stock: number;
  declare category: string;
}

Product.init({
  // 1. El código largo para el QR
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // 2. La clave corta interna
  short_code: {
    type: DataTypes.STRING
  },
  // 3. Descripción
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // 4. Cantidad en inventario
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // 5. Categoría
  category: {
    type: DataTypes.STRING,
    defaultValue: 'consumible'
  }
}, {
  sequelize,
  modelName: 'product',
});

export default Product;