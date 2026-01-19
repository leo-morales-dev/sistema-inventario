import { NextResponse } from 'next/server';
import sequelize from '@/lib/db';
import Product from '@/models/Product';
import { Op } from 'sequelize'; // Importante para filtros avanzados

// GET: Obtener todos (Ya lo tenías)
export async function GET() {
  try {
    await sequelize.sync();
    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error al conectar BD' }, { status: 500 });
  }
}

// POST: Crear uno (Ya lo tenías)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = body.code?.toUpperCase().replace(/'/g, '-').trim();
    
    const newProduct = await Product.create({
      code,
      short_code: body.short_code,
      description: body.description,
      stock: parseInt(body.stock) || 0,
      category: body.category
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: 'Código duplicado' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- NUEVO MÉTODO DELETE (BORRADO MASIVO) ---
export async function DELETE(request: Request) {
  try {
    // 1. Obtener el filtro de la URL (ej: /api/products?filter=low)
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let whereClause = {};

    // 2. Definir qué borrar según el filtro
    switch (filter) {
      case 'herramienta':
        whereClause = { category: 'herramienta' };
        break;
      case 'consumible':
        whereClause = { category: 'consumible' };
        break;
      case 'low': // Stock bajo (menor a 5)
        whereClause = { stock: { [Op.lt]: 5 } };
        break;
      case 'all':
        whereClause = {}; // Borra todo (sin condiciones)
        break;
      default:
        return NextResponse.json({ error: 'Filtro no válido' }, { status: 400 });
    }

    // 3. Ejecutar borrado
    const deletedCount = await Product.destroy({
      where: whereClause
    });

    return NextResponse.json({ success: true, count: deletedCount });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}