import React, { useEffect, useState, useMemo } from 'react';
import { Category, MenuItem, CartItem, Order, OrderStatus } from '../types';
import { MockService } from '../services/mockService';
import { Badge } from './ui/Badge';

interface CustomerAppProps {
  tableId: string;
  onExit?: () => void; // Optional callback for when used inside Admin
}

export const CustomerApp: React.FC<CustomerAppProps> = ({ tableId, onExit }) => {
  const [activeTab, setActiveTab] = useState<'MENU' | 'CART' | 'ORDERS'>('MENU');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // State for Name Modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [customerName, setCustomerName] = useState('');

  // Initial Data Load
  useEffect(() => {
    // Fetch Dynamic Menu
    MockService.getMenu().then(items => setMenuItems(items));

    // Subscribe to orders
    const unsubscribe = MockService.subscribeToOrders((allOrders) => {
      const filtered = allOrders
        .filter(o => o.tableId === tableId && o.status !== OrderStatus.CLOSED)
        .sort((a, b) => b.timestamp - a.timestamp); // Newest first
      setMyOrders(filtered);
    });
    return () => unsubscribe();
  }, [tableId]);

  const filteredMenu = useMemo(() => {
    if (selectedCategory === 'ALL') return menuItems;
    return menuItems.filter(item => item.category === selectedCategory);
  }, [selectedCategory, menuItems]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && !i.notes);
      if (existing) {
        return prev.map(i => i.tempId === existing.tempId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, tempId: Math.random().toString(36), notes: '' }];
    });
  };

  const updateCartQuantity = (tempId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.tempId === tempId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateCartNotes = (tempId: string, notes: string) => {
    setCart(prev => prev.map(item => item.tempId === tempId ? { ...item, notes } : item));
  };

  const handlePreSubmit = () => {
    if (cart.length === 0) return;
    setShowNameModal(true);
  };

  const submitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor, informe seu nome.');
      return;
    }

    setIsSubmitting(true);
    try {
      await MockService.createOrder(tableId, cart, customerName);
      setCart([]);
      setShowNameModal(false);
      alert('Pedido enviado com sucesso!');
      
      // If used via onExit (Admin mode), maybe we want to go back or stay?
      // For now, let's just clear the cart. If admin wants to leave, they click "Voltar".
      if (!onExit) {
         window.location.hash = '#/admin'; // Redirect for demo flow
      } else {
         onExit(); // Return to table map
      }
    } catch (e) {
      alert('Erro ao enviar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.hash = '#/';
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const ordersTotal = myOrders.reduce((acc, order) => acc + order.total, 0);

  // Styling Adjustments for Embedded Mode
  const containerClass = onExit 
    ? 'h-full flex flex-col bg-gray-50' 
    : 'bg-gray-50 min-h-screen pb-20 md:pb-0 h-full overflow-y-auto';

  return (
    <div className={containerClass}>
      {/* Header */}
      <header className={`${onExit ? 'bg-white border-b p-2' : 'sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100'}`}>
        <div className={`${onExit ? 'w-full px-2' : 'max-w-3xl mx-auto px-4 py-3'} flex justify-between items-center`}>
          <div>
            {!onExit && <h1 className="text-xl font-bold text-brand-600">SmartOrder</h1>}
            {onExit && <h2 className="text-lg font-bold text-gray-800">Novo Pedido</h2>}
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'MENU' && cart.length > 0 && (
              <button 
                onClick={() => setActiveTab('CART')}
                className="bg-brand-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg animate-pulse"
              >
                Ver Cesta ({cart.length})
              </button>
            )}
            
            <button 
              onClick={handleExit}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 rounded-full hover:bg-gray-100 flex items-center gap-1"
              title="Voltar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {onExit ? <span className="text-sm font-medium pr-2">Cancelar</span> : ''}
            </button>
          </div>
        </div>
        
        {/* Category Scroll - Only on Menu */}
        {activeTab === 'MENU' && (
          <div className={`overflow-x-auto whitespace-nowrap px-2 py-2 scrollbar-hide bg-white ${onExit ? 'border-t border-gray-100 mt-2' : ''}`}>
            <button
               onClick={() => setSelectedCategory('ALL')}
               className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mr-2 transition-colors
                 ${selectedCategory === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Todos
            </button>
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium mr-2 transition-colors
                  ${selectedCategory === cat ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className={`flex-1 overflow-y-auto ${onExit ? 'p-4' : 'max-w-3xl mx-auto px-4 py-6 w-full'}`}>
        {/* MENU VIEW */}
        {activeTab === 'MENU' && (
          <div className="space-y-6">
            {!onExit && <h2 className="text-2xl font-bold text-gray-800">{selectedCategory === 'ALL' ? 'Cardápio Completo' : selectedCategory}</h2>}
            {filteredMenu.length === 0 ? (
               <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">Nenhum item nesta categoria.</p>
               </div>
            ) : (
            <div className={`grid grid-cols-1 ${onExit ? 'lg:grid-cols-1 xl:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
              {filteredMenu.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex h-28 border border-gray-100">
                  <div className="w-1/3 bg-gray-200 relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-2/3 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 leading-tight mb-1 text-sm">{item.name}</h3>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-brand-600 text-sm">R$ {item.price.toFixed(2)}</span>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-brand-50 text-brand-700 px-2 py-1 rounded-lg text-xs font-medium hover:bg-brand-100 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* CART VIEW */}
        {activeTab === 'CART' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Conferir Pedido</h2>
            {cart.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500 mb-4">Cesta vazia.</p>
                <button onClick={() => setActiveTab('MENU')} className="text-brand-600 font-medium">Voltar ao Cardápio</button>
              </div>
            ) : (
              <>
                <div className="space-y-3 pb-24">
                  {cart.map(item => (
                    <div key={item.tempId} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                        <span className="font-medium text-gray-600 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Unitário: R$ {item.price.toFixed(2)}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Obs: Sem cebola..."
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 mb-2 focus:outline-none focus:border-brand-500"
                        value={item.notes || ''}
                        onChange={(e) => updateCartNotes(item.tempId, e.target.value)}
                      />
                      <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2">
                            <button onClick={() => updateCartQuantity(item.tempId, -1)} className="text-gray-500 px-2 py-1 text-lg">-</button>
                            <span className="font-medium w-4 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.tempId, 1)} className="text-gray-500 px-2 py-1 text-lg">+</button>
                         </div>
                         <button 
                           onClick={() => updateCartQuantity(item.tempId, -100)} 
                           className="text-xs text-red-500 font-medium"
                         >
                           Remover
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Floating Bottom Action for Cart */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-40`}>
                      <div className="flex justify-between items-center mb-2 text-lg font-bold">
                        <span>Total</span>
                        <span>R$ {cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={handlePreSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-brand-700 shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}
                      </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STATUS VIEW (Optional in Admin Mode) */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Meus Pedidos</h2>
            
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border-l-4 border-brand-500">
               <p className="text-sm text-gray-500">Total Consumido (Parcial)</p>
               <p className="text-3xl font-bold text-brand-600">R$ {ordersTotal.toFixed(2)}</p>
               <p className="text-xs text-gray-400 mt-1">Peça a conta ao garçom para fechar.</p>
            </div>

            {myOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Você ainda não fez nenhum pedido.</p>
            ) : (
              <div className="space-y-4">
                {myOrders.map(order => (
                  <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                      <div>
                         <span className="text-xs text-gray-400">Pedido #{order.id.slice(-4)} • {order.customerName}</span>
                         <p className="text-xs text-gray-400">{new Date(order.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <Badge status={order.status} />
                    </div>
                    <ul className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm flex justify-between">
                          <span className="text-gray-800">
                            <span className="font-bold">{item.quantity}x</span> {item.name}
                            <span className="text-xs text-gray-500 ml-1">(R$ {item.price.toFixed(2)})</span>
                          </span>
                          <span className="text-gray-500">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-right font-bold text-gray-800 text-sm">
                      Total: R$ {order.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Name Input Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Novo Pedido</h3>
            <p className="text-gray-500 mb-4 text-sm">Identificação do Cliente para a comanda.</p>
            
            <form onSubmit={submitOrder}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente / Garçom</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Ex: Mesa 1 ou João"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav - Only show if NOT in admin (onExit is null) */}
      {!onExit && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
          <button 
            onClick={() => setActiveTab('MENU')}
            className={`flex flex-col items-center ${activeTab === 'MENU' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="text-xs font-medium mt-1">Cardápio</span>
          </button>
          <button 
            onClick={() => setActiveTab('CART')}
            className={`flex flex-col items-center relative ${activeTab === 'CART' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="text-xs font-medium mt-1">Cesta</span>
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')}
            className={`flex flex-col items-center ${activeTab === 'ORDERS' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <span className="text-xs font-medium mt-1">Status</span>
          </button>
        </nav>
      )}
    </div>
  );
};