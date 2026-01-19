"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Save, FileText, Link as LinkIcon, CheckCircle, Wand2, EyeOff, Plus, ArrowLeft, AlertCircle 
} from 'lucide-react';
import Swal from 'sweetalert2'; 
import { Product } from '@/types/product';

// Definimos el tipo de dato que viene del sessionStorage
interface XmlItem {
  id_temp: string;
  rfc: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valorUnitario?: number;
  action: 'NEW' | 'LINK' | 'SKIP';
  newName?: string; 
  newCode?: string; 
  newCategory?: 'herramienta' | 'consumible';
  newCost?: number;
  newPrice?: number;
  targetProductId?: number;
}

export default function ProcessInvoicePage() {
  const router = useRouter();
  const [items, setItems] = useState<XmlItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]); // Para el select de vincular
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    // 1. Recuperar items del XML
    const storedData = sessionStorage.getItem('pendingXmlItems');
    if (!storedData) {
      // Si no hay datos (acceso directo por URL), volver al inventario
      router.push('/inventory');
      return;
    }
    setItems(JSON.parse(storedData));

    // 2. Cargar productos existentes para poder vincular
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  // --- MANEJADORES ---

  const handleItemChange = (id_temp: string, field: string, value: any) => {
    setItems(prev => prev.map(item => 
        item.id_temp === id_temp ? { ...item, [field]: value } : item
    ));
  };

  const generateRandomCode = (id_temp: string) => {
    const random = Math.floor(1000 + Math.random() * 9000);
    handleItemChange(id_temp, 'newCode', `ART-${random}`);
  };

  const handleCancel = () => {
    sessionStorage.removeItem('pendingXmlItems'); // Limpiar
    router.push('/inventory');
  };

  const handleSaveAll = async () => {
    // Filtramos los que no sean SKIP
    const itemsToProcess = items.filter(i => i.action !== 'SKIP');
    
    if (itemsToProcess.length === 0) {
        Swal.fire('Info', 'No hay items para procesar.', 'info').then(() => handleCancel());
        return;
    }

    // Validar que los NEW tengan código y nombre
    const invalid = itemsToProcess.find(i => i.action === 'NEW' && (!i.newCode || !i.newName));
    if (invalid) {
        return Swal.fire('Error', 'Todos los productos nuevos deben tener Nombre y Código.', 'warning');
    }

    // Validar que los LINK tengan target
    const invalidLink = itemsToProcess.find(i => i.action === 'LINK' && !i.targetProductId);
    if (invalidLink) {
        return Swal.fire('Error', 'Selecciona un producto existente para vincular.', 'warning');
    }

    try {
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
        
        const res = await fetch('/api/inventory/match-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToProcess })
        });
        const data = await res.json();
        
        if(res.ok) {
            Swal.fire('¡Listo!', 'Inventario actualizado correctamente', 'success').then(() => {
                handleCancel(); // Limpiar y volver
            });
        } else {
            throw new Error(data.error);
        }
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Cargando datos de factura...</div>;

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      
      <Sidebar isOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />

      <main className="ml-0 md:ml-64 p-8 transition-all duration-300">
        
        {/* Header de Página */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm mb-2">
                    <ArrowLeft size={16}/> Volver al Inventario
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileText className="text-orange-500" size={28} /> Procesando Factura
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Se detectaron <strong>{items.length}</strong> productos no reconocidos. Configura cómo deseas ingresarlos.
                </p>
            </div>
            
            <div className="flex gap-3">
                <button onClick={handleCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-white border hover:bg-gray-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 transition-colors">
                    Cancelar
                </button>
                <button onClick={handleSaveAll} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 flex items-center gap-2">
                    <CheckCircle size={18}/> Confirmar y Guardar
                </button>
            </div>
        </div>

        {/* LISTA DE TARJETAS (ACTION CARDS) */}
        <div className="space-y-4 pb-20">
            {items.map((item) => (
                <div key={item.id_temp} className={`transition-all duration-300 bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center ${item.action === 'SKIP' ? 'opacity-60 border-dashed border-gray-300 bg-gray-50 dark:bg-slate-950 dark:border-slate-800' : 'border-blue-100 dark:border-slate-700 ring-1 ring-blue-50 dark:ring-slate-800'}`}>
                    
                    {/* 1. INFO DEL PROVEEDOR (IZQUIERDA) */}
                    <div className="flex-1 min-w-[280px]">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200">Cant: {item.cantidad}</span>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">{item.codigo}</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white text-base leading-tight mb-2">{item.descripcion}</p>
                        
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><AlertCircle size={12}/> RFC: {item.rfc}</span>
                            {(item.valorUnitario || 0) > 0 && (
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded">Costo XML: ${item.valorUnitario}</span>
                            )}
                        </div>
                    </div>

                    {/* 2. SELECTOR DE ACCIÓN (CENTRO) */}
                    <div className="flex lg:flex-col gap-2 shrink-0 border-l border-r border-gray-100 dark:border-slate-800 px-6 mx-2">
                        <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider mb-1 lg:block hidden">Acción</p>
                        
                        <button 
                            onClick={() => handleItemChange(item.id_temp, 'action', 'NEW')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'NEW' ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-gray-500 hover:border-blue-300'}`}
                        >
                            <Plus size={16}/> Crear Nuevo
                        </button>
                        
                        <button 
                            onClick={() => handleItemChange(item.id_temp, 'action', 'LINK')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'LINK' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-gray-500 hover:border-emerald-300'}`}
                        >
                            <LinkIcon size={16}/> Vincular
                        </button>
                        
                        <button 
                            onClick={() => handleItemChange(item.id_temp, 'action', 'SKIP')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'SKIP' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-600'}`}
                        >
                            <EyeOff size={16}/> Ignorar
                        </button>
                    </div>

                    {/* 3. ÁREA DE EDICIÓN DINÁMICA (DERECHA) */}
                    <div className="flex-[2] w-full">
                        {item.action === 'SKIP' ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic border-2 border-dashed border-gray-200 rounded-xl p-4">
                                <EyeOff size={24} className="mb-2 opacity-50"/>
                                <span>Este ítem no se agregará al inventario.</span>
                            </div>
                        ) : item.action === 'NEW' ? (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-left-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre en Inventario</label>
                                        <input 
                                            type="text" 
                                            value={item.newName} 
                                            onChange={(e) => handleItemChange(item.id_temp, 'newName', e.target.value)}
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Código Interno</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={item.newCode} 
                                                onChange={(e) => handleItemChange(item.id_temp, 'newCode', e.target.value)}
                                                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-950 dark:text-white font-mono" 
                                            />
                                            <button onClick={() => generateRandomCode(item.id_temp)} title="Generar ID Aleatorio" className="p-2 bg-white border border-gray-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                                <Wand2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Categoría</label>
                                        <select 
                                            value={item.newCategory} 
                                            onChange={(e) => handleItemChange(item.id_temp, 'newCategory', e.target.value)}
                                            className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm dark:bg-slate-950 dark:text-white"
                                        >
                                            <option value="consumible">Consumible</option>
                                            <option value="herramienta">Herramienta</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in slide-in-from-left-2 h-full flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-emerald-600 uppercase mb-2 block">Vincular con producto existente:</label>
                                <select 
                                    className="w-full border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-sm dark:bg-slate-950 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    onChange={(e) => handleItemChange(item.id_temp, 'targetProductId', Number(e.target.value))}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Busca en tu inventario --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.description} (Stock: {p.stock})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1 font-medium bg-white/50 p-2 rounded-lg border border-emerald-100">
                                    <CheckCircle size={14}/> 
                                    Se sumarán <strong>{item.cantidad}</strong> unidades al stock actual.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            ))}
        </div>

      </main>
    </div>
  );
}