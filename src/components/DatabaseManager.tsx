
import React, { useState } from 'react';
import { DashboardState, TableSchema, FieldDefinition } from '../types';
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
  const [newTableFields, setNewTableFields] = useState<FieldDefinition[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldDefinition['type']>('text');

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
    const schema = state.tableSchemas.find(s => s.id === activeTab);
    return schema?.fields || [];
  };

  const getCurrentFieldDefinitions = (): FieldDefinition[] => {
    const schema = state.tableSchemas.find(s => s.id === activeTab);
    return schema?.fieldDefinitions || getCurrentSchema().map(f => ({ name: f, type: 'text' }));
  };

  const getCurrentData = (): any[] => {
    if (standardTables.includes(activeTab)) return (state as any)[activeTab];
    return state.customTables[activeTab] || [];
  };

  const formatAutoId = (num: number) => {
    return num.toString().padStart(15, '0');
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
        tableSchemas: state.tableSchemas, // Incluimos esquemas para que el script sepa qué hojas crear
        messageRoutings: state.messageRoutings,
        whatsappMessages: state.whatsappMessages,
        exportedAt: new Date().toISOString(),
        action: 'sync_all'
      };

      const response = await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
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

  const handleAddFieldToNewTable = () => {
    if (!newFieldName) return;
    setNewTableFields([...newTableFields, { name: newFieldName, type: newFieldType }]);
    setNewFieldName('');
    setNewFieldType('text');
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName || newTableFields.length === 0) return;
    const tableId = newTableName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    
    const newSchema: TableSchema = { 
      id: tableId, 
      name: newTableName, 
      fields: ['id', ...newTableFields.map(f => f.name)],
      fieldDefinitions: [{ name: 'id', type: 'text' }, ...newTableFields],
      lastAutoId: 0
    };

    onUpdateState({
      tableSchemas: [...state.tableSchemas, newSchema],
      customTables: { ...state.customTables, [tableId]: [] }
    });

    setNewTableName('');
    setNewTableFields([]);
    setShowNewTableModal(false);
    setActiveTab(tableId);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const record = { ...newRecordData };
    
    if (isCustomTab) {
      const schema = state.tableSchemas.find(s => s.id === activeTab);
      if (schema) {
        const nextId = (schema.lastAutoId || 0) + 1;
        record.id = formatAutoId(nextId);
        
        const updatedSchemas = state.tableSchemas.map(s => 
          s.id === activeTab ? { ...s, lastAutoId: nextId } : s
        );
        
        const updatedCustom = { ...state.customTables };
        updatedCustom[activeTab] = [...(updatedCustom[activeTab] || []), record];
        
        onUpdateState({ 
          tableSchemas: updatedSchemas,
          customTables: updatedCustom 
        });
      }
    } else {
      if (!record.id) record.id = Math.random().toString(36).substr(2, 9);
      onUpdateState({ [activeTab]: [...(state as any)[activeTab], record] });
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
          <div className="bg-white rounded-[48px] w-full max-w-2xl p-12 shadow-3xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">Nueva Estructura Maestro</h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Nombre de la Tabla</label>
                <input required className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="Ej: Inventario de Activos"/>
              </div>
              
              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-6">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Definición de Campos</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    className="flex-1 px-6 py-4 bg-white border border-zinc-200 rounded-2xl outline-none text-sm font-bold" 
                    placeholder="Nombre del campo" 
                    value={newFieldName} 
                    onChange={e => setNewFieldName(e.target.value)}
                  />
                  <select 
                    className="px-6 py-4 bg-white border border-zinc-200 rounded-2xl outline-none text-sm font-bold"
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value as any)}
                  >
                    <option value="text">Texto</option>
                    <option value="number">Numérico</option>
                    <option value="date">Fecha</option>
                    <option value="currency">Moneda</option>
                  </select>
                  <button 
                    onClick={handleAddFieldToNewTable}
                    className="px-6 py-4 bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
                  >
                    Añadir
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/50 rounded-xl border border-zinc-100 opacity-50">
                    <span className="text-xs font-bold text-zinc-500">id (Automático)</span>
                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">000000000000001</span>
                  </div>
                  {newTableFields.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-zinc-100 shadow-sm">
                      <span className="text-xs font-bold text-zinc-800">{f.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-[#d21f3c] uppercase tracking-widest bg-[#d21f3c]/5 px-2 py-1 rounded-md">{f.type}</span>
                        <button onClick={() => setNewTableFields(newTableFields.filter((_, idx) => idx !== i))} className="text-zinc-300 hover:text-red-500"><i className="fas fa-times"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowNewTableModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-zinc-400">Cancelar</button>
                <button 
                  onClick={handleCreateTable} 
                  disabled={!newTableName || newTableFields.length === 0}
                  className="flex-1 py-4 bg-[#d21f3c] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#d21f3c]/20 disabled:opacity-50"
                >
                  Crear Tabla y Sincronizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddRecordModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-[48px] w-full max-w-lg p-12 shadow-3xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-zinc-900 mb-8 uppercase tracking-tighter">Añadir Registro</h3>
            <form onSubmit={handleAddRecord} className="space-y-6">
              {getCurrentFieldDefinitions().map(field => {
                if (field.name === 'id' && isCustomTab) {
                  return (
                    <div key={field.name} className="opacity-50">
                      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{field.name} (Auto-increment)</label>
                      <input disabled className="w-full px-6 py-4 bg-zinc-100 border border-zinc-200 rounded-2xl outline-none font-mono text-xs" value="Generando ID secuencial..."/>
                    </div>
                  );
                }
                
                let inputType = 'text';
                if (field.type === 'number' || field.type === 'currency') inputType = 'number';
                if (field.type === 'date') inputType = 'date';

                return (
                  <div key={field.name}>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                      {field.name} 
                      <span className="ml-2 text-[8px] text-[#d21f3c] bg-[#d21f3c]/5 px-1.5 py-0.5 rounded uppercase">{field.type}</span>
                    </label>
                    <input 
                      required={field.name === 'id'} 
                      type={inputType}
                      step={field.type === 'currency' ? '0.01' : '1'}
                      className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold text-zinc-800" 
                      value={newRecordData[field.name] || ''} 
                      onChange={e => setNewRecordData({...newRecordData, [field.name]: e.target.value})}
                    />
                  </div>
                );
              })}
              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setShowAddRecordModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase text-zinc-400">Cerrar</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;
