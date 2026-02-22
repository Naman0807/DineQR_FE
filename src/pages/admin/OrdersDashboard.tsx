import { useEffect, useState, useRef } from 'react';
import { Clock, ChefHat, CheckCircle, Bell, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Order, OrderStatus } from '../../types';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof Clock; color: string; bg: string; next?: OrderStatus }> = {
  received: { 
    label: 'Received', 
    icon: Clock, 
    color: 'text-blue-500', 
    bg: 'bg-blue-100',
    next: 'preparing'
  },
  preparing: { 
    label: 'Preparing', 
    icon: ChefHat, 
    color: 'text-orange-500', 
    bg: 'bg-orange-100',
    next: 'served'
  },
  served: { 
    label: 'Served', 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bg: 'bg-green-100'
  },
};

export function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus>('received');
  const { isConnected, lastMessage } = useWebSocket('admin');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastMessage?.event === 'order_created') {
      const newOrder = lastMessage.data as Order;
      setOrders(prev => [newOrder, ...prev]);
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } else if (lastMessage?.event === 'order_updated') {
      const updatedOrder = lastMessage.data as Order;
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    }
  }, [lastMessage, soundEnabled]);

  const fetchOrders = async () => {
    try {
      const data = await api.orders.getActive();
      setOrders(data.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.orders.updateStatus(orderId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const ordersByStatus = {
    received: orders.filter(o => o.status === 'received'),
    preparing: orders.filter(o => o.status === 'preparing'),
    served: orders.filter(o => o.status === 'served'),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex items-center gap-1 text-sm ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">{orders.length} active orders</span>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-lg ${soundEnabled ? 'text-orange-500 bg-orange-50' : 'text-gray-400 bg-gray-100'}`}
          title={soundEnabled ? 'Sound On' : 'Sound Off'}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No active orders</p>
          <p className="text-sm text-gray-400 mt-1">New orders will appear here in real-time</p>
        </div>
      ) : (
        <>
          {/* Mobile Tabs */}
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {(['received', 'preparing', 'served'] as OrderStatus[]).map(status => {
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const count = ordersByStatus[status].length;
              
              return (
                <button
                  key={status}
                  onClick={() => setActiveTab(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === status
                      ? `${config.bg} ${config.color} font-medium`
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <StatusIcon className="w-4 h-4" />
                  {config.label}
                  <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile View - Single Column */}
          <div className="lg:hidden space-y-3">
            {ordersByStatus[activeTab].map(order => {
              const config = statusConfig[activeTab];
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-lg">Table {order.table_number}</span>
                        <p className="text-sm text-gray-500">{getTimeAgo(order.created_at)}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <ul className="space-y-2">
                      {order.items.map(item => (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span>
                            <span className="font-medium">{item.quantity}x</span>
                            <span className="ml-2">{item.menu_item_name}</span>
                          </span>
                          <span className="text-gray-500">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-orange-500">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {config.next && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusUpdate(order.id, config.next!)}
                        className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                      >
                        Mark as {statusConfig[config.next!].label}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {ordersByStatus[activeTab].length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No {activeTab} orders
              </div>
            )}
          </div>

          {/* Desktop View - Three Columns */}
          <div className="hidden lg:grid gap-6 grid-cols-3">
            {(['received', 'preparing', 'served'] as OrderStatus[]).map(status => {
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              const statusOrders = ordersByStatus[status];

              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <h2 className="font-semibold text-gray-900">{config.label}</h2>
                    <span className="text-sm text-gray-500">({statusOrders.length})</span>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
                    {statusOrders.map(order => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-bold text-lg">Table {order.table_number}</span>
                              <p className="text-sm text-gray-500">{getTimeAgo(order.created_at)}</p>
                            </div>
                            <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                          </div>
                        </div>

                        <div className="p-4">
                          <ul className="space-y-2">
                            {order.items.map(item => (
                              <li key={item.id} className="flex justify-between text-sm">
                                <span>
                                  <span className="font-medium">{item.quantity}x</span>
                                  <span className="ml-2">{item.menu_item_name}</span>
                                </span>
                                <span className="text-gray-500">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-bold text-orange-500">₹{order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>

                        {config.next && (
                          <div className="p-3 bg-gray-50 border-t border-gray-100">
                            <button
                              onClick={() => handleStatusUpdate(order.id, config.next!)}
                              className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                            >
                              Mark as {statusConfig[config.next!].label}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {statusOrders.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
