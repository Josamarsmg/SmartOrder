
import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import { TABLES } from './constants';
import { CustomerApp } from './components/CustomerApp';
import { KitchenApp } from './components/KitchenApp';
import { AdminApp } from './components/AdminApp';
import { MenuEditorApp } from './components/MenuEditorApp';
import { HistoryApp } from './components/HistoryApp';
import { LoginApp } from './components/LoginApp';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LOGIN');
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Simple Hash-based routing to simulate entering different parts of the app
  // In a real app, you would use React Router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Default to Login if empty or #/login
      if (!hash || hash === '#/login' || hash === '#/') {
        setViewMode('LOGIN');
      } else if (hash.startsWith('#/landing')) {
        setViewMode('LANDING');
      } else if (hash.startsWith('#/kitchen')) {
        setViewMode('KITCHEN');
      } else if (hash.startsWith('#/admin')) {
        setViewMode('ADMIN');
      } else if (hash.startsWith('#/menu-editor')) {
        setViewMode('MENU_EDITOR');
      } else if (hash.startsWith('#/history')) {
        setViewMode('HISTORY');
      } else if (hash.startsWith('#/table/')) {
        const tableId = hash.split('/')[2];
        if (tableId) {
          setActiveTableId(tableId);
          setViewMode('CUSTOMER');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Init

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToTable = (tableId: string) => {
    window.location.hash = `#/table/${tableId}`;
  };

  const navigateToAdmin = () => {
    window.location.hash = `#/admin`;
  };

  const navigateToKitchen = () => {
    window.location.hash = `#/kitchen`;
  };

  const navigateToMenuEditor = () => {
    window.location.hash = `#/menu-editor`;
  };

  const navigateToHistory = () => {
    window.location.hash = `#/history`;
  };

  const logout = () => {
    // Clear user session
    localStorage.removeItem('smartOrder_user');
    window.location.hash = '#/login';
  };

  if (viewMode === 'LOGIN') {
    return <LoginApp />;
  }

  if (viewMode === 'CUSTOMER' && activeTableId) {
    return <CustomerApp tableId={activeTableId} />;
  }

  if (viewMode === 'KITCHEN') {
    return <KitchenApp />;
  }

  if (viewMode === 'ADMIN') {
    return <AdminApp />;
  }

  if (viewMode === 'MENU_EDITOR') {
    return <MenuEditorApp />;
  }

  if (viewMode === 'HISTORY') {
    return <HistoryApp />;
  }

  // LANDING PAGE (Main Menu after Login)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-orange-500 mb-2">SmartOrder</h1>
          <p className="text-gray-400">Painel de Acesso Rápido</p>
        </div>

        {/* Admin/Staff Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={navigateToKitchen}
            className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg font-bold transition-colors flex flex-col items-center gap-2"
          >
             <span className="text-2xl">👨‍🍳</span>
             Acesso Cozinha
          </button>
          
          <button
              onClick={navigateToAdmin}
              className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg font-bold transition-colors flex flex-col items-center gap-2"
          >
               <span className="text-2xl">👔</span>
               Acesso Admin
          </button>

          <button
            onClick={navigateToMenuEditor}
            className="bg-green-600 hover:bg-green-700 p-4 rounded-lg font-bold transition-colors flex flex-col items-center gap-2"
          >
             <span className="text-2xl">📋</span>
            Editar Cardápio
          </button>

          <button
            onClick={navigateToHistory}
            className="bg-gray-600 hover:bg-gray-700 p-4 rounded-lg font-bold transition-colors flex flex-col items-center gap-2"
          >
            <span className="text-2xl">📈</span>
            Balanço
          </button>
        </div>

        {/* QR Simulation Card */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mt-6">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
             <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 8v4M6 16v4m14-8v4m-2-4v4m0 0h2m-2 0h-2m-2 0v4m0-4h-2m2 4h-2m-6-16h4M4 8h4m6 4v4m-4-4v4" /></svg>
             Simulador de QR Code
          </h2>
          <p className="text-xs text-gray-500 mb-4">Clique em uma mesa para simular o cliente escaneando o código.</p>
          <div className="grid grid-cols-3 gap-3">
            {TABLES.slice(0, 6).map(table => (
              <button
                key={table.id}
                onClick={() => navigateToTable(table.id)}
                className="bg-gray-700 hover:bg-orange-600 text-white font-medium py-2 text-sm rounded transition-colors border border-gray-600 hover:border-orange-500"
              >
                {table.name}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={logout}
          className="text-gray-500 hover:text-white text-sm mt-8 underline"
        >
          Sair / Fazer Logout
        </button>
      </div>
    </div>
  );
};

export default App;
