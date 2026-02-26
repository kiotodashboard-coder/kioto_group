
import React from 'react';
import { User, UserRole } from '../types';
import Logo from './Logo';
import { exportKiotoBackup } from '../store';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const DashboardHeader: React.FC<HeaderProps> = ({ user, onLogout, onToggleSidebar }) => {
  return (
    <header className="h-20 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-zinc-500 hover:text-[#d21f3c] transition-colors"
        >
          <i className="fas fa-bars text-xl"></i>
        </button>
        <div className="text-[#d21f3c] transition-all hover:scale-105 duration-300">
          <Logo className="h-10 sm:h-12 w-auto" />
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {user.role === UserRole.SUPER_USER && (
          <button 
            onClick={exportKiotoBackup}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all shadow-lg"
            title="Descargar Respaldo de Datos (JSON)"
          >
            <i className="fas fa-download"></i>
            <span>Backup</span>
          </button>
        )}
        
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-zinc-800">{user.name}</p>
          <p className="text-[10px] text-[#d21f3c] font-black uppercase tracking-tighter">
            {user.role === UserRole.SUPER_USER ? 'Súper Administrador' : 'Gestor de Área'}
          </p>
        </div>
        <button 
          onClick={onLogout}
          className="w-10 h-10 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all text-zinc-400 hover:text-[#d21f3c] border border-zinc-100"
          title="Cerrar Sesión"
        >
          <i className="fas fa-power-off text-sm"></i>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
