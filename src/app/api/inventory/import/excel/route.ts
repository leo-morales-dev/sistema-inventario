import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import Product from '@/models/Product';
// import SupplierCode from '@/models/SupplierCode'; // Si vas a usar claves extra

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No se subió archivo' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) return NextResponse.json({ error: 'Excel inválido' }, { status: 400 });

    let count = 0;

    // Iterar filas (saltando cabecera)
    worksheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header

      const codeRaw = row.getCell(1).value?.toString() || '';
      const description = row.getCell(3).value?.toString() || 'Sin descripción';
      const stock = Number(row.getCell(4).value) || 0;
      
      // Limpieza de código (igual que app.js)
      const code = codeRaw.toUpperCase().trim();

      if (code) {
        const existing = await Product.findOne({ where: { code } });
        if (existing) {
          // Si existe, sumamos stock
          await existing.increment('stock', { by: stock });
        } else {
          // Si no, creamos
          await Product.create({
            code,
            description,
            stock,
            category: 'consumible', // Por defecto
            short_code: '' 
          });
        }
        count++;
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}