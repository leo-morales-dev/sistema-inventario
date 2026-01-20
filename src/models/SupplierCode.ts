import { DataTypes, Model } from 'sequelize';
import sequelize from '@/lib/db';

class SupplierCode extends Model {
  declare id: number;
  declare rfc_proveedor: string;
  declare codigo_proveedor: string;
  declare productId: number;
}

SupplierCode.init({
  rfc_proveedor: {
    type: DataTypes.STRING,
    allowNull: false
    // ¡OJO! Aquí NO debe ir unique: true
  },
  codigo_proveedor: {
    type: DataTypes.STRING,
    allowNull: false
    // ¡OJO! Aquí TAMPOCO debe ir unique: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'supplier_code',
  // ESTA ES LA CLAVE MÁGICA: Hacemos única la PAREJA (RFC + CÓDIGO)
  indexes: [
    {
      unique: true,
      fields: ['rfc_proveedor', 'codigo_proveedor']
    }
  ]
});

export default SupplierCode;