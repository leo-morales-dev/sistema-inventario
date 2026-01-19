import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import SupplierCode from '@/models/SupplierCode';

export async function POST(request: Request) {
  try {
    const { items } = await request.json(); // Array de decisiones

    let procesados = 0;

    for (const item of items) {
      const { action, targetProductId, rfc, codigo, descripcion, cantidad, newCategory } = item;
      
      let finalProductId = null;

      if (action === 'NEW') {
        // Opción A: Crear Producto Nuevo
        const nuevo = await Product.create({
          code: item.newCode || codigo, // Usar código del XML o uno personalizado
          short_code: codigo,
          description: item.newName || descripcion,
          stock: parseFloat(cantidad),
          category: newCategory || 'consumible'
        });
        finalProductId = nuevo.id;

      } else if (action === 'LINK' && targetProductId) {
        // Opción B: Vincular a Existente
        finalProductId = targetProductId;
        const prod = await Product.findByPk(finalProductId);
        if (prod) {
          await prod.increment('stock', { by: parseFloat(cantidad) });
        }
      }

      // Guardar la relación (Mapping) para que la próxima vez sea automático
      if (finalProductId) {
        await SupplierCode.findOrCreate({
          where: { rfc_proveedor: rfc, codigo_proveedor: codigo },
          defaults: { productId: finalProductId }
        });
        procesados++;
      }
    }

    return NextResponse.json({ success: true, count: procesados });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}