import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ChefHat, CheckCircle } from 'lucide-react';
import { useSession } from '../stores/SessionContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import type { Order } from '../types';

const statusConfig = {
  received: { label: 'Received', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'text-orange-500', bg: 'bg-orange-100' },
  served: { label: 'Served', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { sessionId, tableNumber, tableId } = useSession();
  const { isConnected, lastMessage } = useWebSocket('table', tableId || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!sessionId) return;
      try {
        const data = await api.orders.getBySession(sessionId);
        setOrders(data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (lastMessage?.event === 'order_updated') {
      const updatedOrder = lastMessage.data as Order;
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    }
  }, [lastMessage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4">
      <header className="bg-white shadow-sm sticky top-0 z-10 -mx-4 px-4 pt-2 safe-top">
        <div className="py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Your Orders</h1>
            {tableNumber && (
              <p className="text-sm text-gray-500">Table {tableNumber}</p>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            Live
          </div>
        </div>
      </header>

      <main className="py-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const config = statusConfig[order.status];
              const StatusIcon = config.icon;
              
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        <p className="font-bold text-lg mt-1">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{item.quantity}x</span>
                            <span className="ml-2">{item.menu_item_name}</span>
                          </div>
                          <span className="text-gray-500">
                            ₹{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 safe-bottom">
        <button
          onClick={() => navigate('/menu')}
          className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
        >
          Order More
        </button>
      </div>
    </div>
  );
}
