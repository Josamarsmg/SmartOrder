import React, { useState, useEffect } from 'react';
import { Category, MenuItem } from '../types';
import { MockService } from '../services/mockService';

interface MenuEditorAppProps {
  embedded?: boolean;
}

export const MenuEditorApp: React.FC<MenuEditorAppProps> = ({ embedded = false }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    const menu = await MockService.getMenu();
    setItems(menu);
  };

  const handleEdit = (item: MenuItem) => {
    setCurrentItem({ ...item });
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentItem({
      name: '',
      description: '',
      price: 0,
      category: Category.MAINS,
      image: '' // Start empty to force upload or default
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await MockService.deleteMenuItem(id);
      loadMenu();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Convert to Base64 string to store locally without backend
        setCurrentItem({ ...currentItem, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name || !currentItem.price) return;

    // Use a default image if none provided
    const itemToSave = {
      ...currentItem,
      image: currentItem.image || 'https://via.placeholder.com/400x300?text=Sem+Imagem'
    } as MenuItem;

    if (currentItem.id) {
      await MockService.updateMenuItem(itemToSave);
    } else {
      await MockService.addMenuItem(itemToSave);
    }
    setIsEditing(false);
    setCurrentItem({});
    loadMenu();
  };

  return (
    <div className={`min-h-screen bg-gray-50 text-gray-900 font-sans ${embedded ? '' : ''}`}>
      {/* Header */}
      {!embedded && (
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-brand-600">Gestão de Cardápio</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.hash = '#/'}
              className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sair
            </button>
          </div>
        </header>
      )}

      <main className={`${embedded ? 'py-2' : 'p-6 max-w-5xl mx-auto'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Itens Cadastrados</h2>
          <button 
            onClick={handleAddNew}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Item
          </button>
        </div>

        {/* List of Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col group">
              <div className="h-40 overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {item.category}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{item.description}</p>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                  <span className="font-bold text-brand-600 text-lg">R$ {item.price.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                      title="Excluir"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">{currentItem.id ? 'Editar Item' : 'Novo Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Prato</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                  value={currentItem.name || ''}
                  onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select 
                  className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                  value={currentItem.category}
                  onChange={e => setCurrentItem({...currentItem, category: e.target.value as Category})}
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                  value={currentItem.price || ''}
                  onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea 
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md bg-gray-50 border-gray-300 text-gray-900 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2"
                  value={currentItem.description || ''}
                  onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Prato</label>
                
                {/* Image Preview */}
                {currentItem.image && (
                  <div className="mb-2 w-full h-40 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                    <img src={currentItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer transition-colors">
                    <div className="flex flex-col items-center justify-center pt-7">
                        <svg className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <p className="pt-1 text-sm text-gray-500 group-hover:text-gray-600">Clique para selecionar imagem</p>
                    </div>
                    <input 
                      type="file" 
                      className="opacity-0" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};