import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { MockService } from '../services/mockService';
import { Badge } from './ui/Badge';

interface KitchenAppProps {
  embedded?: boolean;
}

export const KitchenApp: React.FC<KitchenAppProps> = ({ embedded = false }) => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubscribe = MockService.subscribeToOrders((allOrders) => {
      // Filter out closed or served orders to keep the board clean
      const activeOrders = allOrders
        .filter(o => o.status !== OrderStatus.CLOSED && o.status !== OrderStatus.SERVED)
        .sort((a, b) => a.timestamp - b.timestamp);
      setOrders(activeOrders);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    MockService.updateOrderStatus(orderId, newStatus);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    return `${diff} min`;
  };

  return (
    <div className={`min-h-screen bg-gray-900 text-gray-100 ${embedded ? '' : 'p-4'}`}>
      {!embedded && (
        <header className="mb-6 flex justify-between items-center border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-orange-500">KDS - Cozinha</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Pedidos Ativos: {orders.length}
            </div>
            <button 
              onClick={() => window.location.hash = '#/'}
              className="text-gray-400 hover:text-white transition-colors"
              title="Voltar ao Início"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
          </div>
        </header>
      )}

      {embedded && (
        <div className="mb-4 flex justify-between items-center text-gray-300 px-1">
           <h2 className="text-xl font-bold">Pedidos em Tempo Real</h2>
           <span className="text-sm bg-gray-800 px-2 py-1 rounded">Ativos: {orders.length}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-20">
            Nenhum pedido pendente na cozinha.
          </div>
        ) : (
          orders.map(order => (
            <div 
              key={order.id} 
              className={`rounded-lg border-2 p-4 shadow-lg flex flex-col justify-between
                ${order.status === OrderStatus.PENDING ? 'border-yellow-500 bg-gray-800' : 'border-blue-500 bg-gray-800'}
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">Mesa {order.tableId}</h2>
                    <p className="text-sm font-semibold text-orange-300 mt-1">{order.customerName}</p>
                    <p className="text-sm text-gray-400">#{order.id.slice(-4)} • {formatTime(order.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-mono font-bold text-orange-400">
                      {getElapsedTime(order.timestamp)}
                    </span>
                    <Badge status={order.status} />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start border-b border-gray-700 pb-2 last:border-0">
                      <div>
                        <span className="font-bold text-lg mr-2 text-white">{item.quantity}x</span>
                        <span className="text-gray-200">{item.name}</span>
                        {item.notes && (
                          <p className="text-yellow-400 text-sm mt-1">⚠️ {item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                {order.status === OrderStatus.PENDING && (
                  <button
                    onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
                  >
                    Iniciar Preparo
                  </button>
                )}
                {order.status === OrderStatus.PREPARING && (
                  <button
                    onClick={() => handleStatusChange(order.id, OrderStatus.READY)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-colors"
                  >
                    Marcar Pronto
                  </button>
                )}
                 {order.status === OrderStatus.READY && (
                  <button
                    onClick={() => handleStatusChange(order.id, OrderStatus.SERVED)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors"
                  >
                    Marcar Servido
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};