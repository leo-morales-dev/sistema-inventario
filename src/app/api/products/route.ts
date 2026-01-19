import { NextResponse } from 'next/server';
import sequelize from '@/lib/db';
import Product from '@/models/Product';
// import { registrarLog } from '@/lib/logger'; // (Implementaremos el logger después)

// GET ya lo tenías...
export async function GET() {
  try {
    await sequelize.sync();
    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error BD' }, { status: 500 });
  }
}

// POST: Nuevo Item (Lógica traída de app.js)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Limpieza básica como tenías en app.js
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
    // Manejo de duplicados (SequelizeUniqueConstraintError)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return NextResponse.json({ error: 'Código duplicado' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}