
import React from 'react';
import { User, UserRole } from '../types';
import { hasPermission, PERMISSIONS } from '../utils/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, isOpen, onClose }) => {
  const menuItems = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Resumen General', roles: [UserRole.SUPER_USER] },
    { id: 'areas', icon: 'fa-layer-group', label: 'Gestión de Áreas', roles: [UserRole.SUPER_USER], permission: PERMISSIONS.MANAGE_AREAS },
    { id: 'users', icon: 'fa-users-cog', label: 'Control de Usuarios', roles: [UserRole.SUPER_USER], permission: PERMISSIONS.MANAGE_USERS },
    { id: 'db-master', icon: 'fa-database', label: 'Base de Datos', roles: [UserRole.SUPER_USER], permission: PERMISSIONS.EDIT_DATABASE },
    { id: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp Bot', roles: [UserRole.SUPER_USER] },
    { id: 'wa-router', icon: 'fa-route', label: 'Enrutamiento Bot', roles: [UserRole.SUPER_USER] },
    { id: 'wa-messages', icon: 'fa-comments', label: 'Mensajes Recibidos', roles: [UserRole.SUPER_USER], permission: PERMISSIONS.SEND_WHATSAPP },
    { id: 'my-area', icon: 'fa-briefcase', label: 'Mi Departamento', roles: [UserRole.USER] },
    { id: 'ai-hub', icon: 'fa-brain', label: 'Inteligencia IA', roles: [UserRole.SUPER_USER, UserRole.USER], permission: PERMISSIONS.VIEW_INSIGHTS },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-100 text-zinc-500 flex flex-col shrink-0 border-r border-zinc-200 transition-transform duration-300 lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="lg:hidden p-4 flex justify-end">
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-[#d21f3c]">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 py-4 lg:py-8 px-4 space-y-2 overflow-y-auto">
          {menuItems
            .filter(item => {
              // Si es Super Usuario, ve todo lo que le corresponde por rol
              if (currentUser?.role === UserRole.SUPER_USER) {
                return item.roles.includes(UserRole.SUPER_USER);
              }
              
              // Si es Usuario normal, ve lo de su rol O lo que tenga permiso específico
              const hasRole = item.roles.includes(UserRole.USER);
              const hasSpecificPermission = item.permission ? hasPermission(currentUser, item.permission) : false;
              
              return hasRole || hasSpecificPermission;
            })
            .map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-[#d21f3c] text-white shadow-lg shadow-[#d21f3c]/30 translate-x-1' 
                    : 'hover:bg-zinc-200 hover:text-zinc-800'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-sm ${activeTab === item.id ? 'text-white' : 'text-zinc-400'}`}></i>
                <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              </button>
            ))}
        </nav>
        
        <div className="p-6 border-t border-zinc-200">
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-widest">SISTEMA KIOTO</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#d21f3c] rounded-full animate-pulse shadow-[0_0_8px_rgba(210,31,60,0.6)]"></span>
              <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">Núcleo Activo</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
