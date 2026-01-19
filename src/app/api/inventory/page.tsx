"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Search, Plus, Package, Filter, Edit, Trash2, QrCode, 
  Wrench, Layers, AlertTriangle, Save, FileSpreadsheet, ScanBarcode, 
  Download, AlertOctagon, ChevronLeft, ChevronRight, X, FileText
} from 'lucide-react';
import { Product } from '@/types/product'; 
import Swal from 'sweetalert2'; 

export default function InventoryPage() {
  const router = useRouter(); 
  
  // --- ESTADOS ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'herramienta' | 'consumible' | 'low'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [reportFormData, setReportFormData] = useState({ quantity: 1, reason: 'Dañado' });
  
  const [newItem, setNewItem] = useState({
    code: '',
    short_code: '',
    description: '',
    stock: 0,
    category: 'consumible'
  });

  // --- CARGA ---
  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
  }

  // --- BORRADO MASIVO (NUEVA FUNCIONALIDAD) ---
  const handleBulkDelete = async () => {
    // 1. Definir textos según el filtro activo
    let titulo = "¿Estás seguro?";
    let texto = "";
    
    switch (activeFilter) {
        case 'all':
            texto = "Se eliminarán TODOS los productos del inventario. ¡Esta acción es irreversible!";
            break;
        case 'herramienta':
            texto = "Se eliminarán TODAS las HERRAMIENTAS. Los consumibles no se tocarán.";
            break;
        case 'consumible':
            texto = "Se eliminarán TODOS los CONSUMIBLES. Las herramientas no se tocarán.";
            break;
        case 'low':
            texto = "Se eliminarán solo los productos con STOCK BAJO (menos de 5 unidades).";
            break;
    }

    // 2. Alerta de confirmación
    const result = await Swal.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rojo
        cancelButtonColor: '#6b7280', // Gris
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            // 3. Petición DELETE con filtro
            const res = await fetch(`/api/products?filter=${activeFilter}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (res.ok) {
                Swal.fire('Eliminado', `Se eliminaron ${data.count} registros correctamente.`, 'success');
                fetchProducts(); // Recargar tabla
                setCurrentPage(1); // Volver a pág 1
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            Swal.fire('Error', error.message || 'No se pudo eliminar', 'error');
        }
    }
  };

  // --- OTROS HANDLERS ---
  const handleSaveProduct = async () => {
    if(!newItem.code || !newItem.description) return Swal.fire('Error', 'Faltan datos', 'warning');
    const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem) });
    if(res.ok) { Swal.fire('Guardado', 'Registrado con éxito', 'success'); setNewItem({ code: '', short_code: '', description: '', stock: 0, category: 'consumible' }); fetchProducts(); }
  };

  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData(); formData.append('file', e.target.files[0]);
    Swal.fire({ title: 'Analizando...', didOpen: () => Swal.showLoading() });
    try {
        const res = await fetch('/api/inventory/import/xml', { method: 'POST', body: formData });
        const data = await res.json();
        Swal.close();
        if (data.success && data.unmatched?.length > 0) {
            const items = data.unmatched.map((i: any) => ({ ...i, action: 'NEW', newName: i.descripcion, newCode: i.codigo, newCategory: 'consumible', newCost: i.valorUnitario||0, newPrice: (i.valorUnitario||0)*1.3 }));
            sessionStorage.setItem('pendingXmlItems', JSON.stringify(items));
            router.push('/inventory/process-invoice');
        } else if (data.success) {
            Swal.fire('Éxito', `Actualizados ${data.updated} productos.`, 'success'); fetchProducts();
        } else Swal.fire('Error', data.error, 'error');
    } catch(e) { Swal.fire('Error', 'Fallo conexión', 'error'); }
    setIsImportDropdownOpen(false); if(xmlInputRef.current) xmlInputRef.current.value = '';
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData(); formData.append('file', e.target.files[0]);
    await fetch('/api/inventory/import/excel', { method: 'POST', body: formData });
    Swal.fire('Éxito', 'Excel importado', 'success'); fetchProducts(); setIsImportDropdownOpen(false); if(excelInputRef.current) excelInputRef.current.value='';
  };

  // --- RENDER ---
  const filteredProducts = products.filter(p => {
    const s = searchTerm.toLowerCase();
    const match = p.description.toLowerCase().includes(s) || p.code.toLowerCase().includes(s);
    if(!match) return false;
    if(activeFilter === 'low') return p.stock < 5;
    if(activeFilter !== 'all') return p.category === activeFilter;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginate = (n: number) => setCurrentPage(n);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      <Sidebar isOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      <main className="ml-0 md:ml-64 p-8 transition-all duration-300">
        
        {/* Header y Cards */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><Package className="text-blue-500" size={24} /> Gestión de Inventario</h1>
        </header>

        {/* KPI CARDS (FILTROS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {['all', 'herramienta', 'consumible', 'low'].map(type => (
                <button key={type} onClick={() => setActiveFilter(type as any)} className={`p-4 rounded-2xl border text-left transition-all group ${activeFilter === type ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-blue-500'}`}>
                    <div className="flex justify-between">
                        <div>
                            <p className={`text-xs font-bold uppercase ${activeFilter === type ? 'text-blue-200' : 'text-gray-500'}`}>{type==='low'?'Stock Bajo':type==='all'?'Total Items':type}</p>
                            <h3 className={`text-2xl font-bold ${activeFilter === type ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                {type==='all' ? products.length : type==='low' ? products.filter(p=>p.stock<5).length : products.filter(p=>p.category===type).length}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${activeFilter === type ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}><Layers size={20}/></div>
                    </div>
                </button>
            ))}
        </div>

        {/* Sección Alta */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Plus className="text-blue-500"/> Nuevo Item</h3>
                <div className="flex gap-2 relative">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"><ScanBarcode size={16} /> Masiva</button>
                    <div className="relative">
                        <button onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"><FileSpreadsheet size={16} /> Importar</button>
                        {isImportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border z-50 overflow-hidden">
                                <button onClick={() => window.location.href='/api/inventory/template'} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 dark:text-white"><Download size={14}/> Plantilla</button>
                                <button onClick={() => excelInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 dark:text-white"><FileSpreadsheet size={14}/> Excel</button>
                                <button onClick={() => xmlInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t dark:text-white"><FileText size={14}/> XML</button>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={excelInputRef} className="hidden" onChange={handleExcelUpload} />
                    <input type="file" ref={xmlInputRef} className="hidden" onChange={handleXmlUpload} />
                </div>
            </div>
            {/* Inputs Alta */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">QR</label><input className="w-full border rounded p-2 text-sm dark:bg-slate-950 dark:text-white" value={newItem.code} onChange={e=>setNewItem({...newItem, code:e.target.value})} placeholder="A-001"/></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">Clave</label><input className="w-full border rounded p-2 text-sm dark:bg-slate-950 dark:text-white" value={newItem.short_code} onChange={e=>setNewItem({...newItem, short_code:e.target.value})} placeholder="TAL-01"/></div>
                <div className="md:col-span-4"><label className="text-xs font-bold text-gray-500">Descripción</label><input className="w-full border rounded p-2 text-sm dark:bg-slate-950 dark:text-white" value={newItem.description} onChange={e=>setNewItem({...newItem, description:e.target.value})} placeholder="Nombre..."/></div>
                <div className="md:col-span-1"><label className="text-xs font-bold text-gray-500">Stock</label><input type="number" className="w-full border rounded p-2 text-sm text-center dark:bg-slate-950 dark:text-white" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:Number(e.target.value)})}/></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500">Tipo</label><select className="w-full border rounded p-2 text-sm dark:bg-slate-950 dark:text-white" value={newItem.category} onChange={e=>setNewItem({...newItem, category:e.target.value})}><option value="consumible">Consumible</option><option value="herramienta">Herramienta</option></select></div>
                <div className="md:col-span-1"><button onClick={handleSaveProduct} className="w-full bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-700"><Save size={18} className="mx-auto"/></button></div>
            </div>
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Base de datos del inventario</h3>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold"><AlertOctagon size={16} /> Bajas</button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"><Download size={16} /> Excel</button>
                        
                        {/* --- BOTÓN DE BORRADO MASIVO CONECTADO --- */}
                        <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-md shadow-red-500/20">
                            <Trash2 size={16} /> Borrar
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <div className="relative w-full md:w-96"><Search size={18} className="absolute left-3 top-2.5 text-gray-400"/><input className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm dark:bg-slate-950 dark:text-white" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/></div>
                    <div className="flex items-center gap-2 text-sm text-gray-500"><select className="bg-transparent font-bold cursor-pointer" value={itemsPerPage} onChange={e=>setItemsPerPage(Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select> reg.</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950 text-xs uppercase text-gray-500 font-semibold border-b dark:border-slate-800">
                            <th className="px-6 py-4">Producto</th><th className="px-6 py-4">Código</th><th className="px-6 py-4 text-center">Tipo</th><th className="px-6 py-4 text-center">Stock</th><th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {loading ? <tr><td colSpan={5} className="p-10 text-center">Cargando...</td></tr> : 
                         currentItems.length===0 ? <tr><td colSpan={5} className="p-10 text-center">Sin resultados.</td></tr> : (
                            currentItems.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
                                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{p.description}</td>
                                    <td className="px-6 py-4 text-xs font-mono">{p.code}</td>
                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded text-xs border ${p.category==='herramienta'?'bg-purple-50 text-purple-600 border-purple-200':'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>{p.category}</span></td>
                                    <td className="px-6 py-4 text-center font-bold">{p.stock}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-1">
                                        <button className="p-2 text-slate-400 hover:text-blue-600"><QrCode size={16}/></button>
                                        <button className="p-2 text-slate-400 hover:text-amber-500"><Edit size={16}/></button>
                                        <button className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Paginación simple */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-xs text-gray-500">
                <span>{indexOfFirstItem+1}-{Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length}</span>
                <div className="flex gap-2">
                    <button onClick={()=>paginate(currentPage-1)} disabled={currentPage===1} className="px-3 py-1 border rounded disabled:opacity-50">Ant</button>
                    <button onClick={()=>paginate(currentPage+1)} disabled={currentPage===totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Sig</button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}