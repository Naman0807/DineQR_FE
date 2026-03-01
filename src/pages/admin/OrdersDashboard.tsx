import { useEffect, useState, useRef, useMemo } from 'react';
import { Typography, Tabs, Space, Spin, Empty, Button, Badge, message } from 'antd';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Bell,
  Volume2,
  VolumeX
} from 'lucide-react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Order, OrderStatus } from '../../types';
import { StatusColumn } from '../../components/admin/OrdersDashboard/StatusColumn';
import { OrderCard } from '../../components/admin/OrdersDashboard/OrderCard';
import styles from './OrdersDashboard.module.css';

const { Title, Text } = Typography;

const statusConfig: Record<OrderStatus, { label: string; icon: React.ComponentType<{ size?: number; color?: string }>; color: string; bg: string; next?: OrderStatus; nextLabel?: string }> = {
  received: {
    label: 'Received',
    icon: Clock,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    next: 'preparing'
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.1)',
    next: 'served'
  },
  served: {
    label: 'Served',
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34, 197, 10, 0.1)'
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
        audioRef.current.play().catch(() => { });
      }
      message.info(`New order received! Table ${newOrder.table_number} `);
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
      message.error('Failed to sync orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.orders.updateStatus(orderId, { status: newStatus });
      message.success(`Order marked as ${statusConfig[newStatus].label} `);
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update order status');
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

  const ordersByStatus = useMemo(() => ({
    received: orders.filter(o => o.status === 'received'),
    preparing: orders.filter(o => o.status === 'preparing'),
    served: orders.filter(o => o.status === 'served'),
  }), [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" tip="Loading orders..." />
      </div>
    );
  }

  const tabItems = (['received', 'preparing', 'served'] as OrderStatus[]).map(status => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const count = ordersByStatus[status].length;

    return {
      key: status,
      label: (
        <Space>
          <Icon size={16} />
          {config.label}
          <Badge count={count} offset={[10, 0]} size="small" style={{ backgroundColor: config.color }} />
        </Space>
      ),
      children: (
        <div className="space-y-4 pt-4">
          {ordersByStatus[status].map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              getTimeAgo={getTimeAgo}
              formatTime={formatTime}
              statusConfig={statusConfig}
            />
          ))}
          {ordersByStatus[status].length === 0 && (
            <Empty description={`No ${status} orders`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      )
    };
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <Title level={2} className={styles.title}>Orders Dashboard</Title>
          <div className={styles.statusInfo}>
            <div className={styles.liveIndicator}>
              <div
                className={styles.dot}
                style={{ backgroundColor: isConnected ? '#22c55e' : '#9ca3af' }}
              />
              <Text type={isConnected ? undefined : 'secondary'}>
                {isConnected ? 'Live Sync' : 'Reconnecting...'}
              </Text>
            </div>
            <span className={styles.activeOrders}>• {orders.length} active orders</span>
          </div>
        </div>

        <div className={styles.controls}>
          <Button
            shape="circle"
            icon={soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={soundEnabled ? 'text-orange-500' : 'text-gray-400'}
            title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
          />
          <Button
            shape="circle"
            icon={<Bell size={20} />}
            title="Notifications"
          />
        </div>
      </header>

      {/* Desktop Grid View */}
      <div className={styles.desktopGrid}>
        {(['received', 'preparing', 'served'] as OrderStatus[]).map(status => (
          <StatusColumn
            key={status}
            status={status}
            {...statusConfig[status]}
            orders={ordersByStatus[status]}
            onStatusUpdate={handleStatusUpdate}
            getTimeAgo={getTimeAgo}
            formatTime={formatTime}
            statusConfig={statusConfig}
          />
        ))}
      </div>

      {/* Mobile/Tablet Tab View */}
      <div className={styles.mobileTabs}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as OrderStatus)}
          items={tabItems}
          animated
        />
      </div>

      {orders.length === 0 && (
        <div className={styles.emptyState}>
          <Empty
            image={Empty.PRESENTED_IMAGE_DEFAULT}
            description={
              <Space direction="vertical" align="center">
                <Text strong style={{ fontSize: '18px' }}>Waiting for orders</Text>
                <Text type="secondary">New orders will appear here automatically</Text>
              </Space>
            }
          />
        </div>
      )}
    </div>
  );
}
