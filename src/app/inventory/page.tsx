"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Hook de navegación
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
  
  // Refs para inputs ocultos
  const excelInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'herramienta' | 'consumible' | 'low'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modales (Solo Editar y Reportar, el de XML se fue a otra página)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Formularios
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [reportFormData, setReportFormData] = useState({ quantity: 1, reason: 'Dañado' });
  
  // Formulario Nuevo Item (Manual)
  const [newItem, setNewItem] = useState({
    code: '',
    short_code: '',
    description: '',
    stock: 0,
    category: 'consumible'
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- LOGICA DE IMPORTACIÓN XML (REDIRECCIÓN) ---
// --- LOGICA XML (CORREGIDA) ---
  const handleXmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData(); formData.append('file', e.target.files[0]);

    Swal.fire({ title: 'Analizando...', didOpen: () => Swal.showLoading() });

    try {
        const res = await fetch('/api/inventory/import/xml', { method: 'POST', body: formData });
        const data = await res.json();
        Swal.close();

        if (res.ok) {
            if (data.unmatched && data.unmatched.length > 0) {
                const preparedItems = data.unmatched.map((item: any) => ({
                    ...item,
                    action: 'NEW', 
                    newName: item.descripcion,
                    // --- CORRECCIÓN AQUÍ: Código interno inicia vacío ---
                    newCode: '', 
                    newCategory: 'consumible',
                    newCost: item.valorUnitario || 0,
                    newPrice: (item.valorUnitario || 0) * 1.3 
                }));
                sessionStorage.setItem('pendingXmlItems', JSON.stringify(preparedItems));
                router.push('/inventory/process-invoice');
            } else {
                Swal.fire('Éxito', `Procesado. ${data.updated} actualizados.`, 'success');
                fetchProducts();
            }
        } else { Swal.fire('Error', data.error, 'error'); }
    } catch (error) { Swal.fire('Error', 'Fallo de conexión', 'error'); }
    
    setIsImportDropdownOpen(false); if(xmlInputRef.current) xmlInputRef.current.value = '';
  };

  // --- HANDLERS (Excel, Manual, etc.) ---

  const handleSaveProduct = async () => {
    if(!newItem.code || !newItem.description) {
        return Swal.fire('Error', 'Código y Descripción son obligatorios', 'warning');
    }
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });
        const data = await res.json();
        if (res.ok) {
            Swal.fire('Guardado', `Producto ${newItem.description} registrado.`, 'success');
            setNewItem({ code: '', short_code: '', description: '', stock: 0, category: 'consumible' });
            fetchProducts();
        } else {
            Swal.fire('Error', data.error || 'No se pudo guardar', 'error');
        }
    } catch (error) { Swal.fire('Error', 'Error de conexión', 'error'); }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
        const res = await fetch('/api/inventory/import/excel', { method: 'POST', body: formData });
        if (res.ok) {
            Swal.fire('Importación Exitosa', `Registros procesados correctamente.`, 'success');
            fetchProducts();
        } else { Swal.fire('Error', 'Error al procesar Excel', 'error'); }
    } catch (error) { Swal.fire('Error', 'Fallo al subir archivo', 'error'); }
    setIsImportDropdownOpen(false);
    if(excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/inventory/template';
    setIsImportDropdownOpen(false);
  };

  // --- ACCIONES DE TABLA ---
  const handleViewQR = (product: Product) => {
    Swal.fire({
      title: product.description,
      text: `Código: ${product.code}`,
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${product.code}`,
      imageWidth: 150, imageHeight: 150, confirmButtonText: 'Cerrar', confirmButtonColor: '#3b82f6'
    });
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditFormData({ ...product });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!selectedProduct) return;
    // Aquí iría fetch PUT
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, ...editFormData } as Product : p));
    setIsEditModalOpen(false);
    Swal.fire('Actualizado', 'Información modificada.', 'success');
  };

  const openReportModal = (product: Product) => {
    setSelectedProduct(product);
    setReportFormData({ quantity: 1, reason: 'Dañado' });
    setIsReportModalOpen(true);
  };

  const handleReportDamage = () => {
    if (!selectedProduct) return;
    // Aquí iría fetch POST damage
    const newStock = Math.max(0, selectedProduct.stock - reportFormData.quantity);
    setProducts(products.map(p => p.id === selectedProduct.id ? { ...p, stock: newStock } : p));
    setIsReportModalOpen(false);
    Swal.fire({ icon: 'warning', title: 'Reporte Generado', text: `Se descontaron ${reportFormData.quantity} unidades.`, confirmButtonColor: '#f59e0b' });
  };

  const handleDelete = (product: Product) => {
    Swal.fire({
      title: '¿Estás seguro?', text: `Eliminarás "${product.description}".`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b', confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        setProducts(products.filter(p => p.id !== product.id));
        Swal.fire('Eliminado', 'Producto eliminado.', 'success');
      }
    });
  };

  // --- FILTROS Y PAGINACIÓN ---
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeFilter, itemsPerPage]);

  const stats = {
    total: products.length,
    tools: products.filter(p => p.category === 'herramienta').length,
    consumables: products.filter(p => p.category === 'consumible').length,
    lowStock: products.filter(p => p.stock < 5).length
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.short_code && product.short_code.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'low') return product.stock < 5;
    return product.category === activeFilter;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- FUNCIÓN DE BORRADO MASIVO ---
  const handleBulkDelete = async () => {
    // 1. Personalizar mensaje según el filtro actual
    let texto = "";
    switch (activeFilter) {
        case 'all': texto = "Se eliminarán TODOS los productos del inventario. ¡Esta acción es irreversible!"; break;
        case 'herramienta': texto = "Se eliminarán TODAS las HERRAMIENTAS. Los consumibles no se tocarán."; break;
        case 'consumible': texto = "Se eliminarán TODOS los CONSUMIBLES. Las herramientas no se tocarán."; break;
        case 'low': texto = "Se eliminarán solo los productos con STOCK BAJO (menos de 5 unidades)."; break;
    }

    // 2. Alerta de confirmación
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rojo
        cancelButtonColor: '#6b7280', // Gris
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    });

    // 3. Si confirma, ejecutar borrado
    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/products?filter=${activeFilter}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (res.ok) {
                Swal.fire('Eliminado', `Se eliminaron ${data.count} registros correctamente.`, 'success');
                fetchProducts(); // Recargar tabla
                setCurrentPage(1); // Volver a página 1
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            Swal.fire('Error', error.message || 'No se pudo eliminar', 'error');
        }
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      <Sidebar isOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />

      <main className="ml-0 md:ml-64 p-8 transition-all duration-300">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
           <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <Package className="text-blue-500" size={24} /> Gestión de Inventario
              </h1>
           </div>
        </header>

        {/* 1. Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onClick={() => setActiveFilter('all')} className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${activeFilter === 'all' ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-blue-500'}`}>
                <div className="flex justify-between items-start">
                    <div><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeFilter === 'all' ? 'text-blue-200' : 'text-gray-500 dark:text-slate-400'}`}>Total Items</p><h3 className={`text-2xl font-bold ${activeFilter === 'all' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{stats.total}</h3></div>
                    <div className={`p-2 rounded-lg ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400'}`}><Package size={20} /></div>
                </div>
            </button>
            <button onClick={() => setActiveFilter('herramienta')} className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${activeFilter === 'herramienta' ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-500/30' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-purple-500'}`}>
                <div className="flex justify-between items-start">
                    <div><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeFilter === 'herramienta' ? 'text-purple-200' : 'text-gray-500 dark:text-slate-400'}`}>Herramientas</p><h3 className={`text-2xl font-bold ${activeFilter === 'herramienta' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{stats.tools}</h3></div>
                    <div className={`p-2 rounded-lg ${activeFilter === 'herramienta' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600 dark:bg-slate-800 dark:text-purple-400'}`}><Wrench size={20} /></div>
                </div>
            </button>
            <button onClick={() => setActiveFilter('consumible')} className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${activeFilter === 'consumible' ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-emerald-500'}`}>
                <div className="flex justify-between items-start">
                    <div><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeFilter === 'consumible' ? 'text-emerald-200' : 'text-gray-500 dark:text-slate-400'}`}>Consumibles</p><h3 className={`text-2xl font-bold ${activeFilter === 'consumible' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{stats.consumables}</h3></div>
                    <div className={`p-2 rounded-lg ${activeFilter === 'consumible' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-slate-800 dark:text-emerald-400'}`}><Layers size={20} /></div>
                </div>
            </button>
            <button onClick={() => setActiveFilter('low')} className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${activeFilter === 'low' ? 'bg-red-600 border-red-600 shadow-lg shadow-red-500/30' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-red-500'}`}>
                <div className="flex justify-between items-start">
                    <div><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeFilter === 'low' ? 'text-red-200' : 'text-gray-500 dark:text-slate-400'}`}>Stock Bajo</p><h3 className={`text-2xl font-bold ${activeFilter === 'low' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{stats.lowStock}</h3></div>
                    <div className={`p-2 rounded-lg ${activeFilter === 'low' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-slate-800 dark:text-red-400'}`}><AlertTriangle size={20} /></div>
                </div>
            </button>
        </div>

        {/* 2. Sección Alta Rápida */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Plus className="text-blue-500" size={20} /> Nuevo Item
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Registra un nuevo producto.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto relative">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors">
                        <ScanBarcode size={16} /> Entrada Masiva
                    </button>

                    <div className="relative">
                        <button onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                            <FileSpreadsheet size={16} /> Importar Datos
                        </button>
                        {isImportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden">
                                <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <Download size={14}/> Descargar Plantilla
                                </button>
                                <button onClick={() => excelInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <FileSpreadsheet size={14} className="text-emerald-500"/> Subir Excel (.xlsx)
                                </button>
                                <button onClick={() => xmlInputRef.current?.click()} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 border-t border-gray-100 dark:border-slate-700">
                                    <FileText size={14} className="text-orange-500"/> Cargar Factura (XML)
                                </button>
                            </div>
                        )}
                    </div>
                    <input type="file" ref={excelInputRef} accept=".xlsx" className="hidden" onChange={handleExcelUpload} />
                    <input type="file" ref={xmlInputRef} accept=".xml" className="hidden" onChange={handleXmlUpload} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Código QR</label>
                    <input type="text" value={newItem.code} onChange={(e) => setNewItem({...newItem, code: e.target.value})} placeholder="Ej: A-001" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white" />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Clave Corta</label>
                    <input type="text" value={newItem.short_code} onChange={(e) => setNewItem({...newItem, short_code: e.target.value})} placeholder="Ej: TAL-MAK" className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white" />
                </div>
                <div className="lg:col-span-4">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Descripción</label>
                    <input type="text" value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} placeholder="Nombre..." className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white" />
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Stock</label>
                    <input type="number" min="0" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: Number(e.target.value)})} className="no-spinner w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-center dark:text-white" />
                </div>
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">Tipo</label>
                    <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white">
                        <option value="consumible">Consumible</option>
                        <option value="herramienta">Herramienta</option>
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <button onClick={handleSaveProduct} className="w-full h-[38px] flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg" title="Guardar"><Save size={18}/></button>
                </div>
            </div>
        </div>

        {/* 3. Base de Datos (Tabla) */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Base de datos del inventario</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-xs font-bold shadow-md shadow-orange-500/20"><AlertOctagon size={16} /> Bajas</button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-xs font-bold shadow-md shadow-emerald-500/20"><Download size={16} /> Excel</button>
                        <button onClick={handleBulkDelete} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-bold shadow-md shadow-red-500/20"><Trash2 size={16} /> Borrar</button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <span className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500"><Search size={18}/></span>
                        <input type="text" placeholder="Buscar por código, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 text-sm"/>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-800">
                        <span>Mostrar</span>
                        <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent font-bold text-slate-800 dark:text-white outline-none cursor-pointer"><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={20}>20</option></select>
                        <span>registros</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-950/50 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold border-b border-gray-200 dark:border-slate-800">
                            <th className="px-6 py-4">Productos y Clave</th>
                            <th className="px-6 py-4">Código QR</th>
                            <th className="px-6 py-4 text-center">Tipo</th>
                            <th className="px-6 py-4 text-center">Stock</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Cargando...</td></tr> : 
                         currentItems.length === 0 ? <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No se encontraron productos.</td></tr> : (
                            currentItems.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800 dark:text-white text-sm">{product.description}</span>
                                            {product.short_code && <span className="text-xs text-blue-500 font-mono mt-0.5">Clave: {product.short_code}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded text-xs font-mono border border-gray-200 dark:border-slate-700">{product.code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.category === 'herramienta' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'}`}>{product.category.toUpperCase()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold text-sm ${product.stock < 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{product.stock}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleViewQR(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><QrCode size={18} /></button>
                                            <button onClick={() => openEditModal(product)} className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => openReportModal(product)} className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"><AlertTriangle size={18} /></button>
                                            <button onClick={() => handleDelete(product)} className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 gap-4">
                <span className="text-xs text-gray-500 dark:text-slate-500">Mostrando <span className="font-bold text-slate-800 dark:text-white">{indexOfFirstItem + 1}</span> - <span className="font-bold text-slate-800 dark:text-white">{Math.min(indexOfLastItem, filteredProducts.length)}</span> de <span className="font-bold text-slate-800 dark:text-white">{filteredProducts.length}</span> registros</span>
                <div className="flex gap-2 items-center">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronLeft size={14} /> Anterior</button>
                    <span className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">{currentPage}</span>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">Siguiente <ChevronRight size={14} /></button>
                </div>
            </div>
        </div>
      </main>

      {/* --- MODAL EDITAR --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Editar Producto</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Descripción</label><input type="text" value={editFormData.description || ''} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Clave Corta</label><input type="text" value={editFormData.short_code || ''} onChange={(e) => setEditFormData({...editFormData, short_code: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white"/></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Stock</label><input type="number" value={editFormData.stock || 0} onChange={(e) => setEditFormData({...editFormData, stock: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white"/></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
              <button onClick={handleUpdateProduct} className="px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REPORTAR --- */}
      {isReportModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-orange-200 dark:border-orange-900/30 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-800 bg-orange-50 dark:bg-orange-900/10 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><AlertTriangle size={24}/></div>
              <div><h3 className="text-lg font-bold text-slate-800 dark:text-white">Reportar Daño</h3><p className="text-xs text-orange-600 dark:text-orange-400">Descontar del inventario</p></div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Producto: <span className="font-bold">{selectedProduct.description}</span></p>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Cantidad</label><input type="number" min="1" max={selectedProduct.stock} value={reportFormData.quantity} onChange={(e) => setReportFormData({...reportFormData, quantity: Number(e.target.value)})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white"/></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">Motivo</label><textarea rows={2} value={reportFormData.reason} onChange={(e) => setReportFormData({...reportFormData, reason: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm dark:text-white"/></div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
              <button onClick={handleReportDamage} className="px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg">Confirmar Baja</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}