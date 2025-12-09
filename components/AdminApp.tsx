
import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { MockService } from '../services/mockService';
import { TABLES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { KitchenApp } from './KitchenApp';
import { MenuEditorApp } from './MenuEditorApp';
import { HistoryApp } from './HistoryApp';
import { UserManagementApp } from './UserManagementApp';
import { CustomerApp } from './CustomerApp';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type AdminTab = 'DASHBOARD' | 'TABLES' | 'QRCODES' | 'KITCHEN' | 'MENU' | 'HISTORY' | 'USERS';

export const AdminApp: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');
  
  // New state to toggle between "Viewing Table" and "Placing Order"
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // New state to store target customer name for quick add
  const [targetCustomerName, setTargetCustomerName] = useState<string>('');

  // State for Custom URL (fixes localhost testing issues)
  const [baseUrl, setBaseUrl] = useState(window.location.origin + window.location.pathname);

  // Closing Bill States
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);

  // Colors for the chart to match the reference image
  // Orange/Red, Teal, Dark Blue, Yellow/Gold
  const CHART_COLORS = ['#E76F51', '#2A9D8F', '#264653', '#E9C46A', '#F4A261'];

  useEffect(() => {
    const unsubscribe = MockService.subscribeToOrders((allOrders) => {
      setOrders(allOrders);
    });
    return () => unsubscribe();
  }, []);

  // Compute Stats
  const totalSales = orders.reduce((acc, order) => acc + (order.status === OrderStatus.CLOSED ? order.total : 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== OrderStatus.CLOSED && o.status !== OrderStatus.SERVED).length;
  
  // Calculate Best Selling Item
  type ItemStats = { name: string; category: string; quantity: number };
  const itemSalesMap = orders.reduce((acc, order) => {
    // FIX: Add optional chaining and default empty array to prevent crash on undefined items
    (order.items || []).forEach(item => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, category: item.category, quantity: 0 };
      }
      acc[item.name].quantity += item.quantity;
    });
    return acc;
  }, {} as Record<string, ItemStats>);

  const bestSeller: ItemStats = (Object.values(itemSalesMap) as ItemStats[]).sort((a, b) => b.quantity - a.quantity)[0] || { name: '---', category: '---', quantity: 0 };

  // Chart Data: Category Sales
  const categoryDataMap = orders.reduce((acc, order) => {
    // FIX: Add optional chaining and default empty array
    (order.items || []).forEach(item => {
      acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    });
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));

  // Mock Data for Monthly Sales (Simulating history + Current real data)
  const monthlySalesData = [
    { name: 'Jan', value: 0 },
    { name: 'Fev', value: 300 },
    { name: 'Mar', value: 89 },
    { name: 'Abr', value: 256 },
    { name: 'Mai', value: 409 },
    { name: 'Jun', value: 534 },
    { name: 'Jul', value: 321 },
    { name: 'Ago', value: 123 },
    { name: 'Set', value: 267 },
    { name: 'Out', value: 678 },
    { name: 'Nov', value: 890 },
    { name: 'Dez', value: 1000 + totalSales } // Simulating current month adding real sales
  ];

  // Helper for table status
  const getTableStatus = (tableId: string) => {
    const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== OrderStatus.CLOSED);
    if (tableOrders.length === 0) return 'Livre';
    return 'Ocupada';
  };

  const getTableTotal = (tableId: string) => {
    return orders
      .filter(o => o.tableId === tableId && o.status !== OrderStatus.CLOSED)
      .reduce((acc, o) => acc + o.total, 0);
  };

  // Helper to group orders by Customer Name for the Bill
  const getOrdersByPerson = (tableId: string) => {
    const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== OrderStatus.CLOSED);
    const grouped: Record<string, Order[]> = {};
    
    tableOrders.forEach(order => {
      const name = order.customerName || 'Cliente Anônimo';
      if (!grouped[name]) {
        grouped[name] = [];
      }
      grouped[name].push(order);
    });
    
    return grouped;
  };

  const initiateCloseTable = () => {
    setIncludeServiceFee(true);
    setShowCloseModal(true);
  };

  const finalizeCloseTable = async () => {
    if (selectedTable) {
      // Simulate backend closing
      const tableOrders = orders.filter(o => o.tableId === selectedTable && o.status !== OrderStatus.CLOSED);
      // In a real app, we would save the service fee information to the backend here
      tableOrders.forEach(o => MockService.updateOrderStatus(o.id, OrderStatus.CLOSED));
      
      setShowCloseModal(false);
      setSelectedTable(null);
    }
  };

  const handlePrint = () => {
    window.print();
    finalizeCloseTable();
  };

  const handleDownloadPDF = () => {
    if (!selectedTable) return;

    const doc = new jsPDF();
    const subtotal = getTableTotal(selectedTable);
    const serviceFee = includeServiceFee ? subtotal * 0.10 : 0;
    const finalTotal = subtotal + serviceFee;
    const groupedOrders = getOrdersByPerson(selectedTable);

    doc.setFontSize(18);
    doc.text("Recibo - SmartOrder", 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Mesa: ${selectedTable}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 36);

    let finalY = 45;

    // Iterate over customers to create grouped sections in PDF
    Object.entries(groupedOrders).forEach(([customerName, customerOrders]) => {
        // FIX: Ensure items exist before mapping
        const bodyData = customerOrders.flatMap(o => (o.items || []).map(item => [
            `${item.quantity}x ${item.name}`,
            `R$ ${(item.price * item.quantity).toFixed(2)}`
        ]));

        const customerSubtotal = customerOrders.reduce((acc, o) => acc + o.total, 0);

        autoTable(doc, {
            startY: finalY,
            head: [[`Cliente: ${customerName}`, 'Valor']],
            body: bodyData,
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
            columnStyles: { 1: { halign: 'right' } }
        });

        // @ts-ignore
        finalY = doc.lastAutoTable.finalY + 2;
        
        doc.setFontSize(10);
        doc.text(`Subtotal ${customerName}: R$ ${customerSubtotal.toFixed(2)}`, 195, finalY, { align: 'right' });
        finalY += 8;
    });

    // Final Totals Table
    autoTable(doc, {
        startY: finalY + 5,
        body: [
            ['Subtotal Pedidos', `R$ ${subtotal.toFixed(2)}`],
            ...(includeServiceFee ? [['Taxa de Serviço (10%)', `R$ ${serviceFee.toFixed(2)}`]] : []),
            ['TOTAL A PAGAR', `R$ ${finalTotal.toFixed(2)}`]
        ],
        theme: 'plain',
        styles: { fontSize: 12, fontStyle: 'bold', halign: 'right' },
        columnStyles: { 0: { halign: 'right', fontStyle: 'normal' } }
    });

    doc.save(`recibo_mesa_${selectedTable}_${new Date().getTime()}.pdf`);
    finalizeCloseTable();
  };

  const generateQrUrl = (tableId: string) => {
    // Ensure no double slashes if user inputs one
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const appUrl = `${cleanBase}/#/table/${tableId}`;
    // Using a reliable public API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(appUrl)}`;
  };

  const handlePrintQrs = () => {
    window.print();
  };

  const testLink = () => {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    window.open(`${cleanBase}/`, '_blank');
  };

  // Navigation Helper
  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  // Calculations for render
  const currentTableSubtotal = selectedTable ? getTableTotal(selectedTable) : 0;
  const currentServiceFee = includeServiceFee ? currentTableSubtotal * 0.10 : 0;
  const currentFinalTotal = currentTableSubtotal + currentServiceFee;

  // Prepare grouped orders for display in the panel
  const groupedOrdersForPanel = selectedTable ? getOrdersByPerson(selectedTable) : {};

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex">
      {/* Print Only Section for Bill (Only rendered if Table is selected) */}
      {selectedTable && (
        <div className="print-only p-8 bg-white max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-1">Restaurante SmartOrder</h1>
          <p className="text-center text-sm text-gray-500 mb-6">Nota de Conferência</p>
          
          <div className="flex justify-between border-b pb-2 mb-4 text-sm">
            <div>
               <p className="font-bold">Mesa: {selectedTable}</p>
            </div>
            <div>
               <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {Object.entries(getOrdersByPerson(selectedTable)).map(([customerName, customerOrders]) => {
            const customerTotal = customerOrders.reduce((acc, o) => acc + o.total, 0);
            
            return (
              <div key={customerName} className="mb-6">
                <div className="bg-gray-100 p-1 mb-2">
                  <span className="font-bold text-sm uppercase">Cliente: {customerName}</span>
                </div>
                <table className="w-full text-left text-sm mb-2">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="w-12">Qtd</th>
                      <th>Item</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.flatMap(o => (o.items || [])).map((item, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1">{item.quantity}</td>
                        <td className="py-1">
                          {item.name}
                          <span className="text-xs text-gray-500 ml-1">(R$ {item.price.toFixed(2)})</span>
                        </td>
                        <td className="py-1 text-right">R$ {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end text-sm font-semibold">
                   <span>Subtotal {customerName}: R$ {customerTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}

          <div className="border-t-2 border-black pt-4 mt-6">
             <div className="flex justify-between text-sm mb-1">
                <span>Subtotal Pedidos</span>
                <span>R$ {currentTableSubtotal.toFixed(2)}</span>
             </div>
             {includeServiceFee && (
                <div className="flex justify-between text-sm mb-1">
                    <span>Taxa de Serviço (10%)</span>
                    <span>R$ {currentServiceFee.toFixed(2)}</span>
                </div>
             )}
            <div className="flex justify-between font-bold text-2xl mt-2">
                <span>TOTAL GERAL</span>
                <span>R$ {currentFinalTotal.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-center mt-12 text-xs text-gray-400">Obrigado pela preferência!</p>
        </div>
      )}

      {/* Print Only Section for QR Codes */}
      {activeTab === 'QRCODES' && (
        <div className="print-only p-4 bg-white">
          <h1 className="text-xl font-bold text-center mb-4">Códigos das Mesas - SmartOrder</h1>
          <div className="grid grid-cols-4 gap-4">
            {TABLES.map(table => (
              <div key={table.id} className="border border-gray-800 rounded p-2 flex flex-col items-center justify-center text-center">
                 <h2 className="text-lg font-bold mb-1">{table.name}</h2>
                 <img src={generateQrUrl(table.id)} alt={`QR ${table.name}`} className="w-24 h-24 mb-1" />
                 <p className="text-[10px] text-gray-500">Escaneie para pedir</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col no-print shrink-0 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-brand-500">SmartOrder</h1>
          <p className="text-xs text-gray-500">Admin Panel v1.0</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {/* Internal Tabs */}
          <button
            onClick={() => { setActiveTab('DASHBOARD'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'DASHBOARD' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('TABLES')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'TABLES' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="font-medium">Mesas & Pedidos</span>
          </button>

          <button
            onClick={() => { setActiveTab('QRCODES'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'QRCODES' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 8v4M6 16v4m14-8v4m-2-4v4m0 0h2m-2 0h-2m-2 0v4m0-4h-2m2 4h-2m-6-16h4M4 8h4m6 4v4m-4-4v4" /></svg>
            <span className="font-medium">QR Codes</span>
          </button>

          <div className="pt-2"></div>

          <button
            onClick={() => { setActiveTab('KITCHEN'); setSelectedTable(null); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'KITCHEN' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             <span className="font-medium">Cozinha (KDS)</span>
          </button>

          <button
            onClick={() => { setActiveTab('MENU'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'MENU' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="font-medium">Editar Cardápio</span>
          </button>

          <button
            onClick={() => { setActiveTab('HISTORY'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'HISTORY' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span className="font-medium">Balanço</span>
          </button>

          <button
            onClick={() => { setActiveTab('USERS'); setSelectedTable(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'USERS' 
                ? 'bg-brand-600 text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="font-medium">Usuários</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => navigateTo('#/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-white rounded-lg transition-all text-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden no-print bg-gray-100">
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${activeTab === 'KITCHEN' ? 'bg-gray-900 p-4' : 'bg-gray-100 p-6'}`}>
          
          {/* DASHBOARD TAB (Statistics Only) */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Visão Geral (Dashboard)</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                  <h3 className="text-gray-500 text-sm font-medium">Vendas Hoje</h3>
                  <p className="text-2xl font-bold text-gray-800">R$ {totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <h3 className="text-gray-500 text-sm font-medium">Pedidos Abertos</h3>
                  <p className="text-2xl font-bold text-gray-800">{activeOrdersCount}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <h3 className="text-gray-500 text-sm font-medium">Mesas Ocupadas</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {new Set(orders.filter(o => o.status !== OrderStatus.CLOSED).map(o => o.tableId)).size}
                  </p>
                </div>
                {/* Best Selling Item */}
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-500 text-sm font-medium">Item Mais Vendido</h3>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 leading-tight truncate" title={bestSeller.name}>
                    {bestSeller.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {bestSeller.category}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Categorias Mais Vendidas</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 12, fill: '#6b7280'}} 
                          axisLine={false} 
                          tickLine={false}
                          interval={0}
                        />
                        <YAxis 
                           tickFormatter={(value) => `R$${value}`}
                           tick={{fontSize: 12, fill: '#6b7280'}}
                           axisLine={false}
                           tickLine={false}
                        />
                        <Tooltip 
                           cursor={{fill: 'transparent'}}
                           formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                           contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                        />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                 <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-orange-50 rounded-full mb-4">
                      <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Análise de Crescimento</h3>
                    <p className="text-gray-500 mt-2">Os relatórios detalhados de desempenho mensal estão disponíveis na aba "Balanço".</p>
                    <button 
                      onClick={() => setActiveTab('HISTORY')}
                      className="mt-4 text-brand-600 font-medium hover:underline"
                    >
                      Ir para Balanço &rarr;
                    </button>
                 </div>
              </div>

              {/* Monthly Sales Area Chart */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                 <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Vendas Mensais</h2>
                 <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={monthlySalesData}>
                          <defs>
                             <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis 
                             dataKey="name" 
                             tick={{fontSize: 12, fill: '#6b7280'}} 
                             axisLine={false} 
                             tickLine={false}
                          />
                          <YAxis 
                             tickFormatter={(value) => `R$${value}`}
                             tick={{fontSize: 12, fill: '#6b7280'}}
                             axisLine={false}
                             tickLine={false}
                          />
                          <Tooltip 
                             formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                             contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                          />
                          <Area 
                             type="linear" 
                             dataKey="value" 
                             stroke="#2563eb" 
                             strokeWidth={3}
                             fillOpacity={1} 
                             fill="url(#colorSales)" 
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

            </div>
          )}

          {/* TABLES TAB (Map & POS) */}
          {activeTab === 'TABLES' && (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto h-[calc(100vh-80px)]">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Gestão de Mesas</h2>
                  {isPlacingOrder && (
                     <span className="text-sm bg-brand-100 text-brand-800 px-3 py-1 rounded-full font-bold">
                       Modo: Novo Pedido (Mesa {selectedTable})
                     </span>
                  )}
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Table Map (Occupies 2/3 when table selected) */}
                  <div className={`${selectedTable ? 'lg:col-span-2 hidden lg:block' : 'lg:col-span-3'} bg-white rounded-lg shadow p-6 transition-all duration-300 overflow-y-auto`}>
                    <h2 className="text-lg font-bold mb-4">Mapa de Salão ({TABLES.length} Mesas)</h2>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                      {TABLES.map(table => {
                        const status = getTableStatus(table.id);
                        const total = getTableTotal(table.id);
                        const isOccupied = status === 'Ocupada';
                        const isSelected = selectedTable === table.id;
                        
                        return (
                          <div 
                            key={table.id}
                            onClick={() => {
                              setSelectedTable(table.id);
                              setIsPlacingOrder(false); // Reset to view mode first
                            }}
                            className={`
                              cursor-pointer rounded-lg p-1 text-center border-2 transition-all flex flex-col items-center justify-center min-h-[60px] shadow-sm relative overflow-hidden
                              ${isSelected ? 'ring-2 ring-brand-500 ring-offset-2 scale-105 shadow-lg z-10' : ''}
                              ${isOccupied 
                                ? 'bg-red-50 border-red-200 text-red-800' 
                                : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'}
                            `}
                          >
                            <div className="text-xs font-bold w-full truncate px-1" title={table.name}>
                              {table.name}
                            </div>
                            <div className="text-[9px] font-medium uppercase tracking-wide opacity-80 mt-0.5 mb-1">
                              {status}
                            </div>
                            {isOccupied && (
                              <div className="bg-white/60 px-1 py-0 rounded text-[10px] font-mono font-bold border border-black/5 leading-tight">
                                R$ {total.toFixed(2)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed View OR Order View for Selected Table (Occupies 1/3) */}
                  {selectedTable && (
                    <div className="lg:col-span-1 bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-brand-500 animate-fade-in flex flex-col h-full relative z-20">
                      
                      {isPlacingOrder ? (
                        // EMBEDDED CUSTOMER APP (For Placing Orders)
                        <div className="h-full flex flex-col">
                           <CustomerApp 
                              tableId={selectedTable} 
                              onExit={() => setIsPlacingOrder(false)} 
                              initialCustomerName={targetCustomerName} // Passa o nome do cliente selecionado
                           />
                        </div>
                      ) : (
                        // STANDARD DETAILS VIEW
                        <div className="flex flex-col h-full p-6">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h2 className="text-3xl font-bold text-gray-800">Mesa {selectedTable}</h2>
                              <p className={`font-medium ${getTableStatus(selectedTable) === 'Ocupada' ? 'text-red-500' : 'text-green-500'}`}>
                                {getTableStatus(selectedTable)}
                              </p>
                            </div>
                            <button 
                              onClick={() => setSelectedTable(null)}
                              className="text-gray-400 hover:text-gray-600 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Fechar
                            </button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-3 mb-6">
                                <button 
                                  onClick={() => {
                                      setTargetCustomerName(''); // Novo pedido genérico limpa o nome
                                      setIsPlacingOrder(true);
                                  }}
                                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 px-4 rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-[1.02]"
                                >
                                  + Novo Pedido
                                </button>
                                
                                <button 
                                  onClick={initiateCloseTable}
                                  disabled={getTableTotal(selectedTable) === 0}
                                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-2
                                    ${getTableTotal(selectedTable) === 0 
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                      : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  Encerrar Conta
                                </button>
                          </div>

                          {/* Orders List Grouped by Person */}
                          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-4">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Detalhamento por Cliente</h3>
                            
                            {Object.keys(groupedOrdersForPanel).length === 0 ? (
                              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                <p className="text-gray-400">Nenhuma comanda aberta nesta mesa.</p>
                              </div>
                            ) : (
                                Object.entries(groupedOrdersForPanel).map(([name, personOrders]) => {
                                    // Calculate total for this person
                                    const personTotal = personOrders.reduce((acc, o) => acc + o.total, 0);
                                    
                                    return (
                                        <div key={name} className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                        <span className="bg-brand-100 text-brand-800 text-xs px-2 py-1 rounded-full">👤</span>
                                                        {name}
                                                    </h4>
                                                    
                                                    {/* Botão de Adicionar Rápido */}
                                                    <button 
                                                        onClick={() => {
                                                            setTargetCustomerName(name);
                                                            setIsPlacingOrder(true);
                                                        }}
                                                        className="ml-2 text-brand-600 hover:bg-brand-50 p-1 rounded transition-colors"
                                                        title="Adicionar itens para este cliente"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    </button>
                                                </div>

                                                <div className="flex gap-1">
                                                  {personOrders.some(o => o.status === OrderStatus.PENDING) && (
                                                     <span className="w-2 h-2 rounded-full bg-yellow-500" title="Pendente"></span>
                                                  )}
                                                  {personOrders.some(o => o.status === OrderStatus.PREPARING) && (
                                                     <span className="w-2 h-2 rounded-full bg-blue-500" title="Em Preparo"></span>
                                                  )}
                                                  {personOrders.some(o => o.status === OrderStatus.READY) && (
                                                     <span className="w-2 h-2 rounded-full bg-green-500" title="Pronto"></span>
                                                  )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {personOrders.flatMap(o => o.items || []).map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600 truncate max-w-[70%]">
                                                            <span className="font-bold">{item.quantity}x</span> {item.name}
                                                        </span>
                                                        <span className="text-gray-900 font-medium">
                                                            R$ {(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-3 pt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Subtotal ({name})</span>
                                                <span className="font-bold text-gray-900 text-lg">
                                                    R$ {personTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                          </div>

                          {/* Footer Total */}
                          <div className="bg-gray-50 -m-6 mt-0 p-6 border-t border-gray-200">
                            <div className="flex justify-between items-end">
                                <span className="text-xl font-bold text-gray-800">Total da Mesa</span>
                                <span className="text-3xl font-extrabold text-brand-600">R$ {getTableTotal(selectedTable).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* OTHER TABS */}
          {activeTab === 'QRCODES' && (
            <div className="animate-fade-in space-y-6 max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuração de QR Codes</h2>
              
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-brand-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Gerador de Etiquetas</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Configure a URL base e imprima os códigos para as mesas.
                    </p>
                  </div>
                  <button
                    onClick={handlePrintQrs}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-6 rounded shadow flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir Etiquetas
                  </button>
                </div>

                {/* URL Config Field */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Base para os QR Codes
                    <span className="font-normal text-gray-500 ml-2">(Edite se estiver testando em rede local)</span>
                  </label>
                  <div className="flex flex-col md:flex-row gap-2">
                    <input 
                      type="text" 
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="Ex: http://192.168.0.15:3000"
                    />
                    <button 
                      onClick={testLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Testar Link
                    </button>
                    <button 
                      onClick={() => setBaseUrl(window.location.origin + window.location.pathname)}
                      className="text-sm text-brand-600 hover:underline px-2 py-2"
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                  
                  {/* Troubleshooting Guide */}
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      ⚠️ O App não abre no celular? Leia isto!
                    </h4>
                    <p className="mb-2">
                      Se você consegue dar "ping" mas o site não carrega, o problema é que o 
                      servidor de desenvolvimento bloqueia acessos externos por segurança padrão.
                    </p>
                    
                    <div className="bg-white p-3 rounded border border-yellow-300 mb-3">
                      <p className="font-bold text-gray-900 mb-1">Solução 1: Liberar o Servidor</p>
                      <p className="mb-1">Pare o terminal atual (Ctrl + C) e inicie novamente usando este comando:</p>
                      <code className="block bg-gray-800 text-green-400 p-2 rounded font-mono text-xs">
                        npm run dev -- --host
                      </code>
                      <p className="text-xs text-gray-500 mt-1">Ou se usar outro gerenciador: <span className="font-mono">npm start -- --host</span></p>
                    </div>

                    <div className="bg-white p-3 rounded border border-yellow-300 mb-3">
                      <p className="font-bold text-gray-900 mb-1">Solução 2: Firewall do Windows</p>
                      <p>Verifique se o Windows não está bloqueando o <strong>Node.js</strong>. Tente desativar o firewall momentaneamente para testar.</p>
                    </div>

                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="font-bold text-gray-900 mb-1">Solução 3 (Definitiva): Publicar na Internet</p>
                      <p className="text-green-800 mb-2">
                        Publique este código gratuitamente. Você não precisa recriar o app, basta enviar os arquivos.
                      </p>
                      <div className="flex gap-2">
                        <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="bg-black text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-800">
                           Ir para Vercel
                        </a>
                        <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="bg-teal-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-teal-700">
                           Ir para Netlify
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {TABLES.map(table => (
                  <div key={table.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="p-4 flex flex-col items-center">
                      <div className="mb-2 bg-gray-50 p-2 rounded-lg">
                         <img 
                            src={generateQrUrl(table.id)} 
                            alt={`QR Code ${table.name}`}
                            className="w-32 h-32 object-contain"
                            loading="lazy"
                         />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{table.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-1 mb-2 text-center truncate w-full px-2">
                        {baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/#/table/${table.id}
                      </p>
                      <button 
                         className="text-brand-600 hover:text-brand-800 text-xs font-medium hover:underline"
                         onClick={() => {
                           window.open(generateQrUrl(table.id), '_blank');
                         }}
                      >
                        Abrir imagem
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'KITCHEN' && (
             <div className="animate-fade-in">
               <KitchenApp embedded={true} />
             </div>
          )}

          {activeTab === 'MENU' && (
             <div className="animate-fade-in">
               <MenuEditorApp embedded={true} />
             </div>
          )}

          {activeTab === 'HISTORY' && (
             <div className="animate-fade-in">
               <HistoryApp embedded={true} />
             </div>
          )}

          {activeTab === 'USERS' && (
             <div className="animate-fade-in">
               <UserManagementApp embedded={true} />
             </div>
          )}

        </main>
      </div>

      {/* Close Bill Modal */}
      {showCloseModal && selectedTable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in no-print">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Encerrar Mesa {selectedTable}</h3>
                    <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <div className="p-6">
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Subtotal Pedidos</span>
                            <span className="font-bold">R$ {currentTableSubtotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                    <input 
                                        type="checkbox" 
                                        checked={includeServiceFee}
                                        onChange={(e) => setIncludeServiceFee(e.target.checked)}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-brand-500 transition-all duration-300 top-0 left-0"
                                        style={includeServiceFee ? {right: 0, left: 'auto', borderColor: '#f97316'} : {}}
                                    />
                                    <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer" style={includeServiceFee ? {backgroundColor: '#fdba74'} : {}}></label>
                                </div>
                                <span className="text-sm font-medium">Taxa de Serviço (10%)</span>
                            </div>
                            <span className={`font-bold ${includeServiceFee ? 'text-gray-800' : 'text-gray-300'}`}>
                                + R$ {currentServiceFee.toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-2xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                            <span>TOTAL FINAL</span>
                            <span>R$ {currentFinalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleDownloadPDF}
                            className="flex items-center justify-center gap-2 bg-red-100 text-red-700 py-3 rounded-lg font-bold hover:bg-red-200 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Baixar PDF
                        </button>
                        <button 
                            onClick={handlePrint}
                            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                        >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Imprimir
                        </button>
                        <button 
                            onClick={finalizeCloseTable}
                            className="col-span-2 bg-brand-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-700 shadow-lg mt-2"
                        >
                            Fechar Sem Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
