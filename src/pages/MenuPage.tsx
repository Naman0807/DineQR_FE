import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Typography,
  Button,
  Badge,
  Tabs,
  Card,
  Space,
  Spin,
  Alert,
  theme as antTheme,
  Flex,
  Modal,
  message
} from 'antd';
import {
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  SunOutlined,
  MoonOutlined,
  EyeOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { useSession } from '../stores/SessionContext';
import { useCart } from '../stores/CartContext';
import { useTheme } from '../theme/ThemeContext';
import type { MenuItemWithCategory, MenuCategory } from '../types';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export function MenuPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, tableNumber, sessionId, qrToken, endSession } = useSession();
  const { addItem, removeItem, updateQuantity, items, getItemCount, clearCart } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const { token: themeToken } = antTheme.useToken();

  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('table') || qrToken;

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!token && !sessionId) {
          setError('Invalid QR code. Please scan again.');
          setLoading(false);
          return;
        }

        if (!restaurantSlug && token) {
          const tableData = await api.tables.getByToken(token);
          if (!tableData.restaurant_slug) {
            setError('Restaurant not found');
            setLoading(false);
            return;
          }
          navigate(`/${tableData.restaurant_slug}/menu?table=${token}`, { replace: true });
          return;
        }

        if (!restaurantSlug) {
          setError('Restaurant not found');
          setLoading(false);
          return;
        }

        if (!sessionId && token) {
          const sessionData = await api.tables.getOrCreateSession(token, restaurantSlug);
          const tableData = await api.tables.getByToken(token, restaurantSlug);
          setSession({
            tableId: tableData.id,
            tableNumber: sessionData.table_number,
            sessionId: sessionData.session_id,
            qrToken: token,
            restaurantSlug,
          });
        }

        const [itemsData, categoriesData] = await Promise.all([
          api.menu.getItems(true, restaurantSlug),
          api.menu.getCategories(restaurantSlug),
        ]);

        setMenuItems(itemsData);
        setCategories(categoriesData.sort((a, b) => a.display_order - b.display_order));
        setLoading(false);
      } catch (err) {
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    };

    initSession();
  }, [token, sessionId, setSession, restaurantSlug, navigate]);

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category_id === selectedCategory);

  const getItemQuantity = (menuItemId: string) => {
    const item = items.find(i => i.menu_item.id === menuItemId);
    return item?.quantity || 0;
  };

  const handleExit = () => {
    Modal.confirm({
      title: 'End Session?',
      content: 'Are you sure you want to end your dining session? Your cart will be cleared.',
      okText: 'Yes, End Session',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: () => {
        endSession();
        clearCart();
        message.success('Session ended. Thank you for dining with us!');
        navigate(`/${restaurantSlug}/thank-you`);
      },
    });
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">Loading menu...</Text>
        </Space>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
        <Card style={{ maxWidth: 400, margin: 20 }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" onClick={() => window.location.reload()}>
                Retry
              </Button>
            }
          />
        </Card>
      </Flex>
    );
  }

  const tabItems = [
    { key: 'all', label: 'All' },
    ...categories.map(cat => ({ key: cat.id, label: cat.name }))
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
      <Header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: themeToken.colorBgContainer,
        boxShadow: themeToken.boxShadowTertiary,
        height: 'auto',
        lineHeight: 'initial',
        paddingTop: 12,
        paddingBottom: 8
      }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Menu</Title>
          {tableNumber && (
            <Text type="secondary" style={{ fontSize: 12 }}>Table {tableNumber}</Text>
          )}
        </Space>

        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ fontSize: 20 }} />}
            onClick={() => navigate(`/${restaurantSlug}/orders`)}
          />
          <Button
            type="text"
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
          <Badge count={getItemCount()} offset={[-2, 2]}>
            <Button
              type="text"
              icon={<ShoppingCartOutlined style={{ fontSize: 24 }} />}
              onClick={() => navigate(`/${restaurantSlug}/cart`)}
            />
          </Badge>
          <Button
            type="text"
            danger
            icon={<LogoutOutlined style={{ fontSize: 20 }} />}
            onClick={handleExit}
            title="End Session"
          />
        </Space>
      </Header>

      <div style={{ background: themeToken.colorBgContainer, padding: '0 16px', position: 'sticky', top: 68, zIndex: 99 }}>
        <Tabs
          activeKey={selectedCategory}
          onChange={setSelectedCategory}
          items={tabItems}
          tabBarGutter={24}
        />
      </div>

      <Content style={{ padding: '16px', paddingBottom: 100 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="menu-item-card"
                styles={{ body: { padding: 12 } }}
                bordered={false}
              >
                <Flex gap={16}>
                  <div style={{ flexShrink: 0 }}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        style={{ width: 80, height: 80, background: themeToken.colorFillSecondary, borderRadius: 8, fontSize: 32 }}
                      >
                        🍽️
                      </Flex>
                    )}
                  </div>

                  <Flex vertical style={{ flex: 1, minWidth: 0 }} justify="space-between">
                    <div>
                      <Title level={5} style={{ margin: 0, marginBottom: 4 }} ellipsis>{item.name}</Title>
                      <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }} ellipsis={{ rows: 2 }}>
                        {item.description}
                      </Paragraph>
                    </div>

                    <Flex align="center" justify="space-between" style={{ marginTop: 8 }}>
                      <Text strong style={{ color: themeToken.colorPrimary, fontSize: 16 }}>
                        ₹{item.price.toFixed(2)}
                      </Text>

                      {getItemQuantity(item.id) > 0 ? (
                        <Space size={12}>
                          <Button
                            shape="circle"
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => removeItem(item.id)}
                            style={{ background: themeToken.colorFillSecondary }}
                          />
                          <Text strong style={{ minWidth: 20, textAlign: 'center' }}>
                            {getItemQuantity(item.id)}
                          </Text>
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                          />
                        </Space>
                      ) : (
                        <Button
                          type="primary"
                          shape="round"
                          size="middle"
                          onClick={() => addItem(item)}
                        >
                          Add
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Space>

          {filteredItems.length === 0 && (
            <Flex vertical align="center" style={{ padding: '40px 0' }}>
              <Text type="secondary">No items available in this category.</Text>
            </Flex>
          )}
        </div>
      </Content>

      {getItemCount() > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          background: themeToken.colorBgContainer,
          borderTop: `1px solid ${themeToken.colorBorderSecondary}`,
          boxShadow: themeToken.boxShadowTertiary,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate(`/${restaurantSlug}/cart`)}
              style={{ height: 50, borderRadius: 12, fontWeight: 600 }}
            >
              View Cart ({getItemCount()} items)
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
