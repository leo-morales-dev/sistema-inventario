import { NextResponse } from 'next/server';
import Product from '@/models/Product';
import SupplierCode from '@/models/SupplierCode';
import sequelize from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    // Usamos { alter: true } para que Sequelize intente corregir la tabla si cambió el modelo
    await sequelize.sync({ alter: true });

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    let procesados = 0;

    for (const item of items) {
      // 1. Limpieza de datos
      const rfc = item.rfc ? item.rfc.trim() : null;
      const codigo = item.codigo ? item.codigo.trim() : null;
      
      const { action, targetProductId, descripcion, cantidad, newName, newCode, newCategory } = item;
      
      let finalProductId = null;

      // 2. Lógica de Producto (Crear o Vincular)
      if (action === 'NEW') {
        const codeToUse = newCode && newCode.trim() !== '' ? newCode.trim() : `GEN-${Math.floor(Math.random()*100000)}`;
        try {
            const nuevo = await Product.create({
                code: codeToUse,
                short_code: codigo, // Guardamos la clave del proveedor
                description: newName || descripcion,
                stock: parseFloat(cantidad),
                category: newCategory || 'consumible'
            });
            finalProductId = nuevo.id;
        } catch (e) {
            console.error("Error creando producto:", e);
            continue; 
        }
      } else if (action === 'LINK' && targetProductId) {
        finalProductId = targetProductId;
        const prod = await Product.findByPk(finalProductId);
        if (prod) {
          await prod.increment('stock', { by: parseFloat(cantidad) });
        }
      }

      // 3. Guardar la relación (Mapeo)
      // Usamos un bloque try/catch específico para evitar que el error de duplicado tumbe todo el proceso
      if (finalProductId && rfc && codigo) {
        try {
            // Intentamos buscar, si no existe, creamos
            const [mapping, created] = await SupplierCode.findOrCreate({
                where: { rfc_proveedor: rfc, codigo_proveedor: codigo },
                defaults: { productId: finalProductId }
            });

            // Si ya existía pero apuntaba a otro lado (o queremos asegurarnos que apunte al actual)
            // Podríamos actualizarlo aquí si fuera necesario, pero por seguridad lo dejamos así.
            if (!created && mapping.productId !== finalProductId) {
                console.warn(`El código ${codigo} del RFC ${rfc} ya estaba vinculado a otro producto (ID: ${mapping.productId})`);
            }
            procesados++;
        } catch (err) {
            console.error("Error al guardar SupplierCode (ignorable):", err);
            // No lanzamos error, permitimos que continúe con los siguientes items
        }
      }
    }

    return NextResponse.json({ success: true, count: procesados });

  } catch (error: any) {
    console.error("Error CRÍTICO en match-xml:", error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}