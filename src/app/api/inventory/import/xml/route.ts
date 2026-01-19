import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import { Op } from 'sequelize';
import sequelize from '@/lib/db'; 
import Product from '@/models/Product';
import SupplierCode from '@/models/SupplierCode';

export async function POST(request: Request) {
  try {
    // 1. Sincronizar DB por seguridad (evita errores si es la primera vez)
    await sequelize.sync();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió archivo' }, { status: 400 });
    }

    // --- IMPORTANTE: XML se lee como TEXTO, no como Buffer binario ---
    const textBuffer = await file.text();
    
    // 2. Parsear el XML a objeto JSON
    const xmlData = await parseStringPromise(textBuffer, { explicitArray: false, ignoreAttrs: false });

    // 3. Validar estructura CFDI básica
    const comprobante = xmlData['cfdi:Comprobante'];
    if (!comprobante) {
      return NextResponse.json({ error: 'El archivo no es un XML/CFDI válido' }, { status: 400 });
    }

    const emisor = comprobante['cfdi:Emisor'];
    // Obtenemos el RFC del proveedor para guardarlo en la relación
    const rfcProveedor = emisor?.['$']?.['Rfc'] || 'GENERICO';
    
    let conceptosBlock = comprobante['cfdi:Conceptos']?.['cfdi:Concepto'];
    
    // Normalizar a array (xml2js devuelve objeto si es 1 solo item, array si son varios)
    const listaConceptos = Array.isArray(conceptosBlock) ? conceptosBlock : (conceptosBlock ? [conceptosBlock] : []);
    
    const productosDesconocidos: any[] = [];
    let productosActualizados = 0;

    // 4. Procesar cada concepto de la factura
    for (const item of listaConceptos) {
      const atrs = item['$'];
      // Algunos proveedores usan NoIdentificacion, otros ClaveProdServ
      const codigoProv = atrs['NoIdentificacion'] || atrs['ClaveProdServ'];
      const descripcionProv = atrs['Descripcion'];
      const cantidad = parseFloat(atrs['Cantidad']);
      const valorUnitario = parseFloat(atrs['ValorUnitario']);

      if (codigoProv) {
        // A) Buscar mapeo existente en tabla intermedia (SupplierCode)
        let mapeo = await SupplierCode.findOne({
          where: { rfc_proveedor: rfcProveedor, codigo_proveedor: codigoProv }
        });

        let productoID = mapeo?.productId;

        // B) Si no hay mapeo, buscar coincidencia directa en Product (por si el código coincide exacto)
        if (!productoID) {
          const productoManual = await Product.findOne({
            where: {
              [Op.or]: [
                { code: codigoProv }, 
                { short_code: codigoProv }
              ]
            }
          });

          if (productoManual) {
            // ¡Encontrado! Crear el mapeo automático para la próxima vez
            await SupplierCode.create({
              rfc_proveedor: rfcProveedor,
              codigo_proveedor: codigoProv,
              productId: productoManual.id
            });
            productoID = productoManual.id;
          }
        }

        // C) Ejecutar acción según resultado
        if (productoID) {
          // CASO 1: Producto YA existe -> Actualizar Stock
          const prod = await Product.findByPk(productoID);
          if (prod) {
            await prod.increment('stock', { by: cantidad });
            productosActualizados++;
          }
        } else {
          // CASO 2: Producto NO existe -> Agregar a lista para procesar en frontend
          productosDesconocidos.push({
            id_temp: Math.random().toString(36).substr(2, 9), // ID temporal para React
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
    console.error("Error XML Route:", error);
    return NextResponse.json({ error: error.message || 'Error procesando XML' }, { status: 500 });
  }
}