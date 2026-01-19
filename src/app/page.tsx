"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { useTheme } from '@/context/ThemeContext';
// Importamos 'Menu' para el icono de hamburguesa
import { Coins, Users, ShoppingCart, Search, Globe, ArrowRight, FileText, Sun, Moon, Menu } from 'lucide-react';

const SalesChart = dynamic(() => import('@/components/SalesChart'), { 
  ssr: false,
  loading: () => <div className="h-80 bg-gray-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
});

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  
  // Estado para controlar el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen font-sans transition-colors duration-300">
      
      {/* Pasamos el estado y la función para cerrar al Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        closeMobileMenu={() => setIsMobileMenuOpen(false)} 
      />

      <main className="ml-0 md:ml-64 p-8 transition-all duration-300">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
           <div className="flex items-center gap-4 w-full md:w-auto">
              {/* BOTÓN HAMBURGUESA (Solo visible en móvil 'md:hidden') */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-600 dark:text-white bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800"
              >
                <Menu size={24} />
              </button>

              <div>
                <nav className="text-sm text-gray-500 dark:text-slate-500 mb-1">
                   Pages <span className="mx-2">/</span> <span className="text-slate-800 dark:text-white font-medium">Dashboard</span>
                </nav>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Overview</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative group flex-1 md:flex-none">
                  <span className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-500"><Search size={18}/></span>
                  <input 
                      type="text" 
                      placeholder="Type to search..." 
                      className="w-full md:w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600 shadow-sm"
                  />
              </div>
              
              <button 
                onClick={toggleTheme}
                className="h-10 w-10 bg-white dark:bg-slate-900 rounded-full border border-gray-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-yellow-400 hover:scale-110 transition-transform shadow-sm shrink-0"
              >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
           </div>
        </header>

        {/* Stats Grid - Responsivo (1 col en móvil, 2 en tablet, 4 en desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
              title="Today's Money" 
              value="$53,000" 
              percentage="+55%" 
              isPositive={true} 
              period="since yesterday"
              icon={<Coins size={22} />}
              iconBgColor="bg-blue-600"
          />
          <StatCard 
              title="Today's Users" 
              value="2,300" 
              percentage="+3%" 
              isPositive={true} 
              period="since last week"
              icon={<Globe size={22} />}
              iconBgColor="bg-rose-500"
          />
          <StatCard 
              title="New Clients" 
              value="+3,462" 
              percentage="-2%" 
              isPositive={false} 
              period="since last quarter"
              icon={<Users size={22} />}
              iconBgColor="bg-emerald-500"
          />
          <StatCard 
              title="Total Sales" 
              value="$103,430" 
              percentage="+5%" 
              isPositive={true} 
              period="than last month"
              icon={<ShoppingCart size={22} />}
              iconBgColor="bg-orange-500"
          />
        </div>

        {/* Content Grid - Responsivo (1 col móvil, 3 desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-black/20">
             <div className="mb-6 flex justify-between items-center">
                 <div>
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Sales Overview</h3>
                     <p className="text-gray-500 dark:text-slate-400 text-sm">
                        <span className="text-emerald-500 font-bold">(+43%)</span> than last year
                     </p>
                 </div>
             </div>
             <SalesChart />
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between min-h-[400px] text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <div className="relative z-10">
                  <div className="bg-white/10 backdrop-blur-md w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-white/20">
                       <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Versatile Design</h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6">
                      Switch between Light and Dark mode seamlessly to match your environment.
                  </p>
              </div>

              <a href="#" className="relative z-10 flex items-center gap-2 text-sm font-bold group hover:gap-3 transition-all">
                  Read documentation <ArrowRight size={16} />
              </a>
          </div>

        </div>
      </main>
    </div>
  );
}