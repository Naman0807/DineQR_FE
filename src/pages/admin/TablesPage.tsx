import { useEffect, useState } from 'react';
import { Plus, Trash2, QrCode, Download, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import type { Table, TableWithQR } from '../../types';

export function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<TableWithQR | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await api.tables.getAll();
      setTables(data.sort((a, b) => a.table_number - b.table_number));
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableNumber.trim()) return;
    
    setCreating(true);
    try {
      await api.tables.create({ table_number: parseInt(newTableNumber, 10) });
      setShowAddModal(false);
      setNewTableNumber('');
      fetchTables();
    } catch (error) {
      console.error('Failed to create table:', error);
      alert('Failed to create table. It may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await api.tables.delete(id);
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      alert('Failed to delete table.');
    }
  };

  const handleViewQR = async (table: Table) => {
    try {
      const data = await api.tables.getWithQR(table.id);
      setShowQRModal(data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    }
  };

  const getQRDataUrl = (base64Data: string) => {
    if (base64Data.startsWith('data:')) return base64Data;
    return `data:image/png;base64,${base64Data}`;
  };

  const downloadQR = (table: TableWithQR) => {
    const dataUrl = getQRDataUrl(table.qr_code_url);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `table-${table.table_number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row md:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-5 lg:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage restaurant tables and QR codes</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchTables}
            className="p-2.5 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Table</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 lg:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map(table => (
          <div
            key={table.id}
            className="bg-white rounded-xl shadow-sm p-4 md:p-5 border border-gray-100"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2 md:mb-3">
                <span className="text-xl md:text-2xl font-bold text-orange-500">{table.table_number}</span>
              </div>
              <span className={`inline-block px-2.5 py-1 text-xs md:text-sm rounded-full ${
                table.status === 'available' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {table.status}
              </span>
              <div className="flex gap-1 mt-3 md:mt-4">
                <button
                  onClick={() => handleViewQR(table)}
                  className="p-2.5 min-h-[44px] min-w-[44px] text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="View QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-2.5 min-h-[44px] min-w-[44px] text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Table"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tables yet. Add your first table to get started.
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Table</h2>
            <input
              type="number"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Table number"
              className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4 text-lg"
              min="1"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 min-h-[44px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTable}
                disabled={creating || !newTableNumber.trim()}
                className="px-4 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-md text-center">
            <h2 className="text-xl font-bold mb-1">Table {showQRModal.table_number}</h2>
            <p className="text-gray-500 mb-4 text-sm">Scan to view menu</p>
            <div className="bg-white p-3 rounded-xl inline-block mb-4 border border-gray-100">
              <img src={getQRDataUrl(showQRModal.qr_code_url)} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56 mx-auto" />
            </div>
            <p className="text-xs text-gray-400 mb-4 break-all px-4">
              {window.location.origin}/menu?table={showQRModal.qr_token}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowQRModal(null)}
                className="px-4 py-2.5 min-h-[44px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => downloadQR(showQRModal)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
