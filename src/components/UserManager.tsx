
import React, { useState } from 'react';
import { User, Area, UserRole } from '../types';
import { PERMISSIONS } from '../utils/auth';

interface UserManagerProps {
  users: User[];
  areas: Area[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, areas, onAddUser, onDeleteUser, onUpdateUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    password: '', 
    role: UserRole.USER, 
    assignedAreaId: '',
    permissions: [] as string[]
  });

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      onUpdateUser(editingUserId, formData);
    } else {
      onAddUser(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      password: '', 
      role: UserRole.USER, 
      assignedAreaId: '',
      permissions: []
    });
    setEditingUserId(null);
    setShowModal(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password || '',
      role: user.role,
      assignedAreaId: user.assignedAreaId || '',
      permissions: user.permissions || []
    });
    setEditingUserId(user.id);
    setShowModal(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Directorio de Personal</h2>
          <p className="text-zinc-500 font-medium">Control jerárquico y aprovisionamiento de firmas digitales</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#d21f3c] text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20 font-black text-xs uppercase tracking-widest"
        >
          <i className="fas fa-plus"></i> Registrar Usuario
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Identidad</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Contacto</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Privilegios</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Jurisdicción</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Comandos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shadow-zinc-200">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 tracking-tight">{user.name}</p>
                        <p className="text-xs text-zinc-400 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-zinc-700 font-bold">{user.phone}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter ${
                      user.role === UserRole.SUPER_USER 
                        ? 'bg-[#d21f3c] text-white' 
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {user.role === UserRole.SUPER_USER ? 'Súper Usuario' : 'Estándar'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.role === UserRole.SUPER_USER ? (
                      <span className="text-zinc-300 font-black text-[10px] uppercase italic tracking-widest">Acceso Total</span>
                    ) : (
                      <span className="text-sm text-zinc-800 font-bold">
                        {areas.find(a => a.id === user.assignedAreaId)?.name || 'Sin jurisdicción'}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Editar Usuario"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button 
                        disabled={user.role === UserRole.SUPER_USER && users.filter(u => u.role === UserRole.SUPER_USER).length === 1}
                        onClick={() => onDeleteUser(user.id)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-[#d21f3c] hover:bg-red-50 rounded-xl transition-all disabled:opacity-10"
                      >
                        <i className="fas fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-500/10 backdrop-blur-xl flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-[32px] sm:rounded-[48px] w-full max-w-xl p-6 sm:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/20 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter uppercase">
              {editingUserId ? 'Modificar Usuario' : 'Provisión de Usuario'}
            </h3>
            <p className="text-zinc-400 font-medium mb-10 text-sm">
              {editingUserId ? 'Actualiza los privilegios y datos de la identidad.' : 'Registra una nueva identidad en el ecosistema.'}
            </p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Nombre Completo <span className="text-[#d21f3c]">*</span></label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Marc Thompson"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Email <span className="text-[#d21f3c]">*</span></label>
                <input 
                  type="email" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@kioto.cloud"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Teléfono Móvil <span className="text-[#d21f3c]">*</span></label>
                <input 
                  type="tel" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Contraseña <span className="text-[#d21f3c]">*</span></label>
                <input 
                  type="password" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Nivel de Acceso</label>
                <select 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 appearance-none transition-all"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.USER}>Gestor de Área</option>
                  <option value={UserRole.SUPER_USER}>Súper Usuario</option>
                </select>
              </div>
              {formData.role === UserRole.USER && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Jurisdicción Asignada</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 appearance-none transition-all"
                      value={formData.assignedAreaId}
                      onChange={e => setFormData({...formData, assignedAreaId: e.target.value})}
                    >
                      <option value="">Seleccione el departamento responsable...</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Permisos Especiales (Roles Dinámicos)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(PERMISSIONS).map(([key, value]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => togglePermission(value)}
                          className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                            formData.permissions.includes(value)
                              ? 'bg-[#d21f3c] text-white border-[#d21f3c]'
                              : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
                          }`}
                        >
                          {key.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="md:col-span-2 flex gap-4 pt-10">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-8 py-5 border border-zinc-100 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all"
                >
                  Cerrar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-5 bg-[#d21f3c] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20"
                >
                  {editingUserId ? 'GUARDAR CAMBIOS' : 'EJECUTAR ALTA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
