import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Typography,
  Button,
  Card,
  Space,
  Flex,
  Tag,
  List,
  Spin,
  theme as antTheme
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useSession } from '../stores/SessionContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import type { Order } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const statusConfig: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
  received: { label: 'Received', icon: <ClockCircleOutlined />, color: 'blue' },
  preparing: { label: 'Preparing', icon: <SyncOutlined spin />, color: 'orange' },
  served: { label: 'Served', icon: <CheckCircleOutlined />, color: 'green' },
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { sessionId, tableNumber, tableId } = useSession();
  const { isConnected, lastMessage } = useWebSocket('table', tableId || '');
  const { token: themeToken } = antTheme.useToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!sessionId) return;
      try {
        const data = await api.orders.getBySession(sessionId, restaurantSlug);
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
  }, [sessionId, restaurantSlug]);

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
      <Flex align="center" justify="center" style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
      <Header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        background: themeToken.colorBgContainer,
        boxShadow: themeToken.boxShadowTertiary,
        height: 'auto',
        lineHeight: 'initial',
        paddingTop: 12,
        paddingBottom: 8
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />}
          onClick={() => navigate(`/${restaurantSlug}/menu`)}
          style={{ marginLeft: -8 }}
        />
        <Space direction="vertical" size={0} style={{ flex: 1 }}>
          <Title level={4} style={{ margin: 0 }}>Your Orders</Title>
          {tableNumber && (
            <Text type="secondary" style={{ fontSize: 12 }}>Table {tableNumber}</Text>
          )}
        </Space>
        <Tag color={isConnected ? 'success' : 'default'} style={{ borderRadius: 12, margin: 0 }}>
          <Space size={4}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#52c41a' : '#bfbfbf' }} />
            Live
          </Space>
        </Tag>
      </Header>

      <Content style={{ padding: '16px', paddingBottom: 100 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {orders.length === 0 ? (
            <Flex vertical align="center" justify="center" style={{ padding: '60px 0' }}>
              <Text type="secondary" style={{ marginBottom: 24, fontSize: 16 }}>No orders yet</Text>
              <Button
                type="primary"
                size="large"
                shape="round"
                onClick={() => navigate(`/${restaurantSlug}/menu`)}
              >
                Browse Menu
              </Button>
            </Flex>
          ) : (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {orders.map(order => {
                const config = statusConfig[order.status] || { label: order.status, color: 'default', icon: null };

                return (
                  <Card
                    key={order.id}
                    bordered={false}
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ padding: 16, borderBottom: `1px solid ${themeToken.colorBorderSecondary}` }}>
                      <Flex justify="space-between" align="center">
                        <div>
                          <Text type="secondary" style={{ fontSize: 13 }}>{formatDate(order.created_at)}</Text>
                          <Title level={4} style={{ margin: '4px 0 0 0' }}>₹{order.total_amount.toFixed(2)}</Title>
                        </div>
                        <Tag
                          color={config.color}
                          icon={config.icon}
                          style={{ padding: '4px 12px', borderRadius: 16, fontSize: 14, fontWeight: 500 }}
                        >
                          {config.label}
                        </Tag>
                      </Flex>
                    </div>

                    <div style={{ padding: 16 }}>
                      <Text strong style={{ display: 'block', marginBottom: 12, color: themeToken.colorTextSecondary, fontSize: 13, textTransform: 'uppercase' }}>
                        Items
                      </Text>
                      <List
                        dataSource={order.items}
                        renderItem={item => (
                          <List.Item style={{ padding: '8px 0', border: 'none' }}>
                            <Flex justify="space-between" style={{ width: '100%' }}>
                              <Text>
                                <Text strong>{item.quantity}x</Text>
                                <span style={{ marginLeft: 12 }}>{item.menu_item_name}</span>
                              </Text>
                              <Text type="secondary">₹{(item.unit_price * item.quantity).toFixed(2)}</Text>
                            </Flex>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Card>
                );
              })}
            </Space>
          )}
        </div>
      </Content>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        background: `linear-gradient(transparent, ${themeToken.colorBgLayout} 20%)`,
        pointerEvents: 'none'
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', pointerEvents: 'auto' }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={() => navigate(`/${restaurantSlug}/menu`)}
            style={{ height: 50, borderRadius: 12, fontWeight: 600, boxShadow: themeToken.boxShadow }}
          >
            Order More
          </Button>
        </div>
      </div>
    </Layout>
  );
}
