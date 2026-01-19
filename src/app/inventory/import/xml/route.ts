import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { Op } from 'sequelize';
import Product from '@/models/Product';
import SupplierCode from '@/models/SupplierCode';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No se subió archivo' }, { status: 400 });

    const textBuffer = await file.text();
    const xmlData = await parseStringPromise(textBuffer, { explicitArray: false, ignoreAttrs: false });

    // Navegar la estructura del CFDI
    const comprobante = xmlData['cfdi:Comprobante'];
    if (!comprobante) return NextResponse.json({ error: 'XML inválido' }, { status: 400 });

    const emisor = comprobante['cfdi:Emisor'];
    const rfcProveedor = emisor?.['$']?.['Rfc'] || 'GENERICO';
    let conceptosBlock = comprobante['cfdi:Conceptos']?.['cfdi:Concepto'];
    
    // Normalizar a array
    const listaConceptos = Array.isArray(conceptosBlock) ? conceptosBlock : (conceptosBlock ? [conceptosBlock] : []);
    
    const productosDesconocidos: any[] = [];
    let productosActualizados = 0;

    for (const item of listaConceptos) {
      const atrs = item['$'];
      const codigoProv = atrs['NoIdentificacion'] || atrs['ClaveProdServ'];
      const descripcionProv = atrs['Descripcion'];
      const cantidad = parseFloat(atrs['Cantidad']);
      const valorUnitario = parseFloat(atrs['ValorUnitario']);

      if (codigoProv) {
        // 1. Buscar mapeo existente
        let mapeo = await SupplierCode.findOne({
          where: { rfc_proveedor: rfcProveedor, codigo_proveedor: codigoProv }
        });

        let productoID = mapeo?.productId;

        // 2. Si no hay mapeo, buscar por código directo en Producto
        if (!productoID) {
          const productoManual = await Product.findOne({
            where: {
              [Op.or]: [{ code: codigoProv }, { short_code: codigoProv }]
            }
          });

          if (productoManual) {
            await SupplierCode.create({
              rfc_proveedor: rfcProveedor,
              codigo_proveedor: codigoProv,
              productId: productoManual.id
            });
            productoID = productoManual.id;
          }
        }

        // 3. Lógica final
        if (productoID) {
          const prod = await Product.findByPk(productoID);
          if (prod) {
            await prod.increment('stock', { by: cantidad });
            productosActualizados++;
          }
        } else {
          productosDesconocidos.push({
            id_temp: Math.random().toString(36).substr(2, 9),
            rfc: rfcProveedor,
            codigo: codigoProv,
            descripcion: descripcionProv,
            cantidad: cantidad,
            valorUnitario: valorUnitario
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      updated: productosActualizados, 
      unmatched: productosDesconocidos 
    });

  } catch (error: any) {
    console.error("XML Error:", error);
    return NextResponse.json({ error: error.message || 'Error procesando XML' }, { status: 500 });
  }
}