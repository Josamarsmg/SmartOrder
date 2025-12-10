
import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { MockService } from '../services/mockService';
import { TABLES } from '../constants';
// Imports de jspdf removidos pois estamos usando via script global

interface HistoryAppProps {
  embedded?: boolean;
}

export const HistoryApp: React.FC<HistoryAppProps> = ({ embedded = false }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    // Subscribe to get all orders (including history)
    const unsubscribe = MockService.subscribeToOrders((allOrders) => {
      // Sort by newest first
      const sorted = [...allOrders].sort((a, b) => b.timestamp - a.timestamp);
      setOrders(sorted);
    });
    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filter by Table
      if (selectedTable !== 'ALL' && order.tableId !== selectedTable) {
        return false;
      }
      // Filter by Date
      if (selectedDate) {
        const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
        if (orderDate !== selectedDate) {
          return false;
        }
      }
      return true;
    });
  }, [orders, selectedTable, selectedDate]);

  // Calculations
  const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);

  // PDF Export
  const handleDownloadPDF = () => {
    // Acessa o objeto global window.jspdf carregado via script tag
    const jsPDF = (window as any).jspdf.jsPDF;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("Relatório de Balanço - SmartOrder", 14, 20);
    doc.setFontSize(12);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const filterText = `Filtros: Mesa [${selectedTable === 'ALL' ? 'Todas' : selectedTable}] - Data [${selectedDate || 'Todas'}]`;
    doc.setFontSize(10);
    doc.text(filterText, 14, 36);

    // Table Data
    const tableData = filteredOrders.map(order => [
      new Date(order.timestamp).toLocaleString(),
      `Mesa ${order.tableId}`,
      order.customerName || 'Cliente Anônimo',
      order.items.map(i => `${i.quantity}x ${i.name} (R$ ${i.price.toFixed(2)})`).join(', '),
      order.status,
      `R$ ${order.total.toFixed(2)}`
    ]);

    // Generate Table - usando doc.autoTable (método injetado pelo plugin)
    (doc as any).autoTable({
      startY: 45,
      head: [['Data/Hora', 'Mesa', 'Cliente', 'Itens', 'Status', 'Valor']],
      body: tableData,
      foot: [['', '', '', '', 'TOTAL:', `R$ ${totalRevenue.toFixed(2)}`]],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] } // Orange brand color
    });

    doc.save(`balanco_smartorder_${new Date().getTime()}.pdf`);
  };

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans ${embedded ? '' : ''}`}>
      {/* Header */}
      {!embedded && (
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10 no-print">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">Balanço & Histórico</h1>
          </div>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Voltar
          </button>
        </header>
      )}

      <main className={`${embedded ? 'py-2' : 'p-6 max-w-7xl mx-auto'}`}>
        
        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Table Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">Filtrar por Mesa</label>
              <select 
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5"
              >
                <option value="ALL">Todas as Mesas</option>
                {TABLES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-500 mb-1">Filtrar por Data</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-2.5"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedTable('ALL'); setSelectedDate(''); }}
                className="text-sm text-brand-600 hover:underline mb-3 ml-2"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => window.print()}
              className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded shadow flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded shadow flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Baixar PDF
            </button>
          </div>
        </div>

        {/* Print Header (Visible only when printing) */}
        <div className="print-only mb-6">
          <h1 className="text-2xl font-bold">Relatório de Vendas</h1>
          <p>Filtros: {selectedTable === 'ALL' ? 'Todas Mesas' : `Mesa ${selectedTable}`} | {selectedDate ? selectedDate.split('-').reverse().join('/') : 'Todas as Datas'}</p>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data / Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resumo do Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Nenhum registro encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.timestamp).toLocaleDateString()} <br/>
                        <span className="text-xs text-gray-400">{new Date(order.timestamp).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Mesa {order.tableId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <ul className="list-disc list-inside">
                          {order.items.map((item, idx) => (
                             <li key={idx} className="truncate max-w-xs text-xs">
                               {item.quantity}x {item.name} <span className="text-gray-400">({item.price.toFixed(2)} un)</span>
                             </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${order.status === OrderStatus.CLOSED 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        R$ {order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-gray-600 uppercase">Total do Período</td>
                  <td className="px-6 py-4 text-right text-brand-600 text-lg">
                    R$ {totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
