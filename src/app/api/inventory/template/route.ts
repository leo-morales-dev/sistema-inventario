import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plantilla Importacion');

  // Columnas esperadas según tu lógica de importación en app.js
  worksheet.columns = [
    { header: 'CODIGO', key: 'code', width: 20 },
    { header: 'CLAVES ADICIONALES (Separa con comas)', key: 'short_code', width: 30 },
    { header: 'DESCRIPCION', key: 'description', width: 40 },
    { header: 'CANTIDAD', key: 'stock', width: 15 },
    // Nota: Categoría se asignará por defecto o podrías agregar columna
  ];

  // Fila de ejemplo
  worksheet.addRow({ code: 'A-001', short_code: 'CLAVE-PROV-1, OTRA-KEY', description: 'Ejemplo Taladro', stock: 10 });

  // Generar Buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=plantilla_inventario.xlsx',
    },
  });
}