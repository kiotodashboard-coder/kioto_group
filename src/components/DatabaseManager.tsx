
import React, { useState } from 'react';
import { DashboardState, TableSchema } from '../types';
import { GLOBAL_CONFIG } from '../constants';

interface DatabaseManagerProps {
  state: DashboardState;
  onUpdateState: (newState: Partial<DashboardState>) => void;
}

const DatabaseManager: React.FC<DatabaseManagerProps> = ({ state, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [showNewTableModal, setShowNewTableModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(state.googleSheetUrl || '');
  
  // States para nueva tabla
  const [newTableName, setNewTableName] = useState('');
  const [newTableFields, setNewTableFields] = useState<string[]>(['id']);
  const [newFieldName, setNewFieldName] = useState('');

  // States para nuevo registro
  const [newRecordData, setNewRecordData] = useState<Record<string, string>>({});

  // State para edición en línea
  const [editingCell, setEditingCell] = useState<{ rowId: string, field: string } | null>(null);
  const [editCellValue, setEditCellValue] = useState('');

  const standardTables = ['users', 'areas', 'insights'];
  const allTabs = [...standardTables, ...state.tableSchemas.map(s => s.id)];

  const isCustomTab = !standardTables.includes(activeTab);

  const getCurrentSchema = (): string[] => {
    if (activeTab === 'users') return ['id', 'name', 'email', 'phone', 'role', 'assignedAreaId'];
    if (activeTab === 'areas') return ['id', 'name', 'description', 'budget', 'status', 'createdAt'];
    if (activeTab === 'insights') return ['id', 'areaId', 'title', 'content', 'timestamp'];
    return state.tableSchemas.find(s => s.id === activeTab)?.fields || [];
  };

  const getCurrentData = (): any[] => {
    if (standardTables.includes(activeTab)) return (state as any)[activeTab];
    return state.customTables[activeTab] || [];
  };

  const handleSyncToSheets = async () => {
    if (!sheetUrl) {
      const url = prompt("Por favor, ingresa la URL de tu Google Apps Script (solo la primera vez):", state.googleSheetUrl || "");
      if (!url) return;
      setSheetUrl(url);
      onUpdateState({ googleSheetUrl: url });
      return;
    }

    setIsSyncing(true);
    try {
      const payload = {
        users: state.users,
        areas: state.areas,
        insights: state.insights,
        customTables: state.customTables,
        messageRoutings: state.messageRoutings,
        whatsappMessages: state.whatsappMessages,
        exportedAt: new Date().toISOString()
      };

      const response = await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Necesario para Apps Script Web Apps si no hay CORS configurado
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      onUpdateState({ 
        googleSheetUrl: sheetUrl, 
        lastSync: new Date().toLocaleString() 
      });
      alert("Sincronización enviada correctamente a Google Sheets.");
    } catch (error) {
      console.error("Error sincronizando:", error);
      alert("Error al conectar con Google Sheets.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName || newTableFields.length === 0) return;
    const tableId = newTableName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    onUpdateState({
      tableSchemas: [...state.tableSchemas, { id: tableId, name: newTableName, fields: newTableFields }],
      customTables: { ...state.customTables, [tableId]: [] }
    });
    setNewTableName('');
    setNewTableFields(['id']);
    setShowNewTableModal(false);
    setActiveTab(tableId);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const record = { ...newRecordData };
    if (!record.id) record.id = Math.random().toString(36).substr(2, 9);
    if (standardTables.includes(activeTab)) {
      onUpdateState({ [activeTab]: [...(state as any)[activeTab], record] });
    } else {
      const updatedCustom = { ...state.customTables };
      updatedCustom[activeTab] = [...(updatedCustom[activeTab] || []), record];
      onUpdateState({ customTables: updatedCustom });
    }
    setNewRecordData({});
    setShowAddRecordModal(false);
  };

  const handleCellEditSubmit = (rowId: string, field: string) => {
    if (standardTables.includes(activeTab)) {
      const newData = (state as any)[activeTab].map((item: any) => 
        item.id === rowId ? { ...item, [field]: editCellValue } : item
      );
      onUpdateState({ [activeTab]: newData });
    } else {
      const updatedCustom = { ...state.customTables };
      updatedCustom[activeTab] = updatedCustom[activeTab].map((item: any) => 
        item.id === rowId ? { ...item, [field]: editCellValue } : item
      );
      onUpdateState({ customTables: updatedCustom });
    }
    setEditingCell(null);
  };

  const deleteRow = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    if (standardTables.includes(activeTab)) {
      const newData = (state as any)[activeTab].filter((item: any) => item.id !== id);
      onUpdateState({ [activeTab]: newData });
    } else {
      const updatedCustom = { ...state.customTables };
      updatedCustom[activeTab] = updatedCustom[activeTab].filter((item: any) => item.id !== id);
      onUpdateState({ customTables: updatedCustom });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-4">
            <i className="fas fa-database text-[#d21f3c]"></i> Motor de Datos Maestro
          </h2>
          <p className="text-zinc-500 font-medium">Gestión de esquemas y edición dinámica de información</p>
        </div>
        <button 
          onClick={() => setShowNewTableModal(true)}
          className="bg-[#d21f3c] text-white px-6 py-4 rounded-2xl flex items-center gap-3 hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20 font-black text-xs uppercase tracking-widest"
        >
          <i className="fas fa-plus-circle"></i> Nueva Tabla
        </button>
      </div>

      {/* Panel de Google Sheets */}
      <div className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <i className="fab fa-google-drive text-2xl"></i>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-zinc-800 uppercase text-sm tracking-tight">
              Sincronización Cloud {GLOBAL_CONFIG.MASTER_SHEET_URL ? '(Global)' : 'con Google Sheets'}
            </h4>
            <p className="text-xs text-zinc-400 font-medium">
              {GLOBAL_CONFIG.MASTER_SHEET_URL 
                ? 'Configuración maestra aplicada a todos los dispositivos.' 
                : 'Conecta tu Apps Script para volcar datos en tiempo real.'}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
            <button 
              onClick={handleSyncToSheets}
              disabled={isSyncing}
              className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                isSyncing ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20'
              }`}
            >
              {isSyncing ? <i className="fas fa-sync animate-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
              {isSyncing ? 'Sincronizando...' : sheetUrl ? 'Actualizar Cloud' : 'Configurar Google Sheets'}
            </button>
            {sheetUrl && !GLOBAL_CONFIG.MASTER_SHEET_URL && (
              <button 
                onClick={() => {
                  const newUrl = prompt("Cambiar URL de Google Sheets:", sheetUrl);
                  if (newUrl) {
                    setSheetUrl(newUrl);
                    onUpdateState({ googleSheetUrl: newUrl });
                  }
                }}
                className="px-4 py-4 bg-white border border-zinc-200 text-zinc-400 rounded-2xl hover:text-zinc-600 transition-all"
                title="Cambiar URL"
              >
                <i className="fas fa-cog"></i>
              </button>
            )}
          </div>
        </div>
        {state.lastSync && (
          <p className="mt-4 text-[9px] text-emerald-600 font-black uppercase tracking-widest text-center lg:text-left">
            Última conexión exitosa: {state.lastSync}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {allTabs.map(tab => {
          const isCustom = !standardTables.includes(tab);
          const label = isCustom ? state.tableSchemas.find(s => s.id === tab)?.name : tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all flex items-center gap-3 border shrink-0 ${
                activeTab === tab 
                  ? 'bg-[#d21f3c] text-white border-[#d21f3c] shadow-lg shadow-[#d21f3c]/20' 
                  : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <i className={`fas ${isCustom ? 'fa-table' : tab === 'users' ? 'fa-user' : tab === 'areas' ? 'fa-building' : 'fa-lightbulb'}`}></i>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-[40px] border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <button 
            onClick={() => setShowAddRecordModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all"
          >
            <i className="fas fa-plus"></i> Nuevo Registro
          </button>
          <div className="flex gap-3 items-center">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest hidden md:block">Doble clic para editar celda</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                {getCurrentSchema().map(field => (
                  <th key={field} className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{field}</th>
                ))}
                <th className="px-8 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {getCurrentData().map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-zinc-50/50 transition-colors">
                  {getCurrentSchema().map(field => (
                    <td key={field} className="px-8 py-6 text-sm text-zinc-600 font-medium">
                      {editingCell?.rowId === row.id && editingCell?.field === field ? (
                        <input 
                          autoFocus
                          className="w-full bg-white border-2 border-[#d21f3c] rounded-xl px-4 py-2 outline-none"
                          value={editCellValue}
                          onChange={e => setEditCellValue(e.target.value)}
                          onBlur={() => handleCellEditSubmit(row.id, field)}
                        />
                      ) : (
                        <div onDoubleClick={() => { setEditingCell({ rowId: row.id, field }); setEditCellValue(String(row[field] || '')); }}>
                          {String(row[field] || '') || <span className="text-zinc-200">vacío</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => deleteRow(row.id)} className="text-zinc-300 hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewTableModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-12 shadow-3xl">
            <h3 className="text-3xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">Nueva Estructura</h3>
            <form onSubmit={handleCreateTable} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Nombre de la Tabla</label>
                <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none" value={newTableName} onChange={e => setNewTableName(e.target.value)}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Campos (separados por coma)</label>
                <input placeholder="campo1, campo2..." className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none" onChange={e => setNewTableFields(['id', ...e.target.value.split(',').map(s => s.trim())])}/>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowNewTableModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-[#d21f3c] text-white rounded-2xl font-black text-[10px] uppercase">Crear Tabla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRecordModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-12 shadow-3xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">Añadir Registro</h3>
            <form onSubmit={handleAddRecord} className="space-y-6">
              {getCurrentSchema().map(field => (
                <div key={field}>
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{field}</label>
                  <input required={field === 'id'} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none" value={newRecordData[field] || ''} onChange={e => setNewRecordData({...newRecordData, [field]: e.target.value})}/>
                </div>
              ))}
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowAddRecordModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase">Cerrar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
