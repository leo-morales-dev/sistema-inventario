import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/db';
import Product from './Product';

class SupplierCode extends Model {
  public id!: number;
  public rfc_proveedor!: string;
  public codigo_proveedor!: string;
  public productId!: number;
}

SupplierCode.init({
  rfc_proveedor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codigo_proveedor: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'supplier_code',
});

// Definimos las relaciones aquí para asegurar que Sequelize las reconozca
Product.hasMany(SupplierCode, { foreignKey: 'productId', as: 'ExtraCodes' });
SupplierCode.belongsTo(Product, { foreignKey: 'productId' });

export default SupplierCode;