"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Save, FileText, Link as LinkIcon, CheckCircle, Wand2, EyeOff, Plus, ArrowLeft, AlertCircle, Layers, Wrench
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
  const [products, setProducts] = useState<Product[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem('pendingXmlItems');
    if (!storedData) {
      router.push('/inventory');
      return;
    }
    setItems(JSON.parse(storedData));

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [router]);

  // --- ACCIONES MASIVAS ---
  const generateAllCodes = () => {
    setItems(prev => prev.map(item => {
        if (item.action === 'NEW') {
            const random = Math.floor(1000 + Math.random() * 9000);
            return { ...item, newCode: `ART-${random}` };
        }
        return item;
    }));
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Códigos Generados', text: 'Se asignaron códigos ART-XXXX a los nuevos ítems.', timer: 2000, showConfirmButton: false });
  };

  const setAllCategory = (category: 'herramienta' | 'consumible') => {
    setItems(prev => prev.map(item => {
        if (item.action === 'NEW') {
            return { ...item, newCategory: category };
        }
        return item;
    }));
    const label = category === 'herramienta' ? 'Herramientas' : 'Consumibles';
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Asignado a ${label}`, timer: 1500, showConfirmButton: false });
  };

  // --- MANEJADORES INDIVIDUALES ---
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
    sessionStorage.removeItem('pendingXmlItems');
    router.push('/inventory');
  };

  const handleSaveAll = async () => {
    const itemsToProcess = items.filter(i => i.action !== 'SKIP');
    
    if (itemsToProcess.length === 0) {
        Swal.fire('Info', 'No hay items para procesar.', 'info').then(() => handleCancel());
        return;
    }

    const invalid = itemsToProcess.find(i => i.action === 'NEW' && (!i.newCode || !i.newName));
    if (invalid) {
        return Swal.fire('Error', 'Todos los productos nuevos deben tener Nombre y Código.', 'warning');
    }

    const invalidLink = itemsToProcess.find(i => i.action === 'LINK' && !i.targetProductId);
    if (invalidLink) {
        return Swal.fire('Error', 'Selecciona un producto existente para vincular.', 'warning');
    }

    try {
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
        const res = await fetch('/api/inventory/import/match-xml', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToProcess })
        });
        const data = await res.json();
        
        if(res.ok) {
            Swal.fire('¡Listo!', 'Inventario actualizado correctamente', 'success').then(() => handleCancel());
        } else {
            throw new Error(data.error);
        }
    } catch (e: any) { Swal.fire('Error', e.message, 'error'); }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 dark:text-slate-400">Cargando...</div>;

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      <Sidebar isOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      <main className="ml-0 md:ml-64 p-8 transition-all duration-300">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <button onClick={handleCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 text-sm mb-2 transition-colors"><ArrowLeft size={16}/> Volver</button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileText className="text-orange-500" size={28} /> Procesando Factura</h1>
            </div>
            <div className="flex gap-3">
                <button onClick={handleCancel} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                <button onClick={handleSaveAll} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg flex items-center gap-2 hover:shadow-blue-500/30 transition-all"><CheckCircle size={18}/> Confirmar</button>
            </div>
        </div>

        {/* BARRA DE ACCIONES RÁPIDAS (NUEVO DISEÑO) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mr-2">Acciones Rápidas:</span>
            
            <button onClick={generateAllCodes} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/50">
                <Wand2 size={16}/> Generar Códigos QR (Auto)
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-2 hidden md:block"></div>
            
            <button onClick={() => setAllCategory('consumible')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50">
                <Layers size={16}/> Todos Consumibles
            </button>
            
            <button onClick={() => setAllCategory('herramienta')} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/50">
                <Wrench size={16}/> Todas Herramientas
            </button>
        </div>

        {/* LISTA DE CARDS */}
        <div className="space-y-4 pb-20">
            {items.map((item) => (
                <div key={item.id_temp} className={`transition-all duration-300 bg-white dark:bg-slate-900 border rounded-xl shadow-sm p-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center ${item.action === 'SKIP' ? 'opacity-60 border-dashed border-gray-300 bg-gray-50 dark:bg-slate-950 dark:border-slate-800' : 'border-blue-100 dark:border-slate-800 ring-1 ring-blue-50 dark:ring-slate-800'}`}>
                    
                    {/* IZQUIERDA: Info XML */}
                    <div className="flex-1 min-w-[280px]">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">Cant: {item.cantidad}</span>
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{item.codigo}</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white text-base leading-tight mb-2">{item.descripcion}</p>
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><AlertCircle size={12}/> RFC: {item.rfc}</span>
                            {(item.valorUnitario || 0) > 0 && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 rounded border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Costo: ${item.valorUnitario}</span>}
                        </div>
                    </div>

                    {/* CENTRO: Botones */}
                    <div className="flex lg:flex-col gap-2 shrink-0 border-l border-r border-gray-100 dark:border-slate-800 px-6 mx-2">
                        <button onClick={() => handleItemChange(item.id_temp, 'action', 'NEW')} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'NEW' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'}`}><Plus size={16}/> Nuevo</button>
                        <button onClick={() => handleItemChange(item.id_temp, 'action', 'LINK')} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'LINK' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-400 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'}`}><LinkIcon size={16}/> Vincular</button>
                        <button onClick={() => handleItemChange(item.id_temp, 'action', 'SKIP')} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-start gap-3 w-36 ${item.action === 'SKIP' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 dark:bg-slate-800 dark:text-gray-400 dark:border-slate-700'}`}><EyeOff size={16}/> Ignorar</button>
                    </div>

                    {/* DERECHA: Formulario */}
                    <div className="flex-[2] w-full">
                        {item.action === 'SKIP' ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 text-sm italic border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-4"><span>Artículo Ignorado</span></div>
                        ) : item.action === 'NEW' ? (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Nombre Final</label>
                                        <input type="text" value={item.newName} onChange={(e) => handleItemChange(item.id_temp, 'newName', e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Código Interno</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={item.newCode} onChange={(e) => handleItemChange(item.id_temp, 'newCode', e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Vacío = Manual"/>
                                            <button onClick={() => generateRandomCode(item.id_temp)} className="p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"><Wand2 size={16}/></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1 block">Categoría</label>
                                        <select value={item.newCategory} onChange={(e) => handleItemChange(item.id_temp, 'newCategory', e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="consumible">Consumible</option><option value="herramienta">Herramienta</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 h-full flex flex-col justify-center">
                                <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2 block">Vincular con:</label>
                                <select className="w-full border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" onChange={(e) => handleItemChange(item.id_temp, 'targetProductId', Number(e.target.value))} defaultValue="">
                                    <option value="" disabled>-- Selecciona del Inventario --</option>
                                    {products.map(p => (<option key={p.id} value={p.id}>{p.description} ({p.code})</option>))}
                                </select>
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