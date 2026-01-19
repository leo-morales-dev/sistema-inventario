import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import Product from '@/models/Product';
import sequelize from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    await sequelize.sync();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No se subió archivo' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    
    // --- CORRECCIÓN AQUÍ ---
    // Agregamos 'as any' para evitar el conflicto de tipos entre Node y ExcelJS
    const buffer = Buffer.from(arrayBuffer) as any; 

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) return NextResponse.json({ error: 'Excel inválido o vacío' }, { status: 400 });

    let count = 0;
    const rowsToProcess: any[] = [];

    // 2. Paso A: Leer filas del Excel
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar cabecera

      const codeRaw = row.getCell(1).value?.toString() || '';
      const description = row.getCell(3).value?.toString() || 'Sin descripción';
      const stock = Number(row.getCell(4).value) || 0;
      
      const code = codeRaw.toUpperCase().trim();

      if (code) {
        rowsToProcess.push({ code, description, stock });
      }
    });

    // 3. Paso B: Guardar en Base de Datos
    for (const item of rowsToProcess) {
      const { code, description, stock } = item;

      const existing = await Product.findOne({ where: { code } });

      if (existing) {
        await existing.increment('stock', { by: stock });
      } else {
        await Product.create({
          code,
          description,
          stock,
          category: 'consumible',
          short_code: '' 
        });
      }
      count++;
    }

    return NextResponse.json({ success: true, count });

  } catch (error: any) {
    console.error("Error importando Excel:", error);
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}