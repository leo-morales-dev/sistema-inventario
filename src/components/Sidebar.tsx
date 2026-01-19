"use client";

import React from 'react';
import Link from 'next/link'; // <--- IMPORTANTE: Usamos Link de Next.js
import { usePathname } from 'next/navigation'; // Para saber en qué página estamos
import { LayoutDashboard, Package, Users, History, ClipboardList, LifeBuoy, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeMobileMenu: () => void;
}

const Sidebar = ({ isOpen, closeMobileMenu }: SidebarProps) => {
  const pathname = usePathname(); // Obtenemos la ruta actual (ej: "/inventory")

  const menuItems = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: "Dashboard", 
      href: "/" // Ruta raíz
    },
    { 
      icon: <ClipboardList size={20} />, 
      label: "Préstamos", 
      href: "/loans" 
    },
    { 
      icon: <Package size={20} />, 
      label: "Inventario", 
      href: "/inventory" // Ruta de inventario
    },
    { 
      icon: <Users size={20} />, 
      label: "Empleados", 
      href: "/employees" 
    },
    { 
      icon: <History size={20} />, 
      label: "Historial", 
      href: "/history" 
    },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={closeMobileMenu}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 overflow-y-auto transition-transform duration-300 shadow-xl dark:shadow-none 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                AT
            </div>
            <span className="text-slate-800 dark:text-white font-semibold text-lg tracking-wide">ATN Admin</span>
          </div>
          <button 
            onClick={closeMobileMenu}
            className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-slate-800 mx-6 mb-6"></div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item, index) => {
            // Verificamos si esta es la página activa
            const isActive = pathname === item.href; 
            
            return (
              <Link
                key={index}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className={isActive ? "text-white" : "text-gray-400 dark:text-slate-500"}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer igual que antes... */}
      </aside>
    </>
  );
};

export default Sidebar;