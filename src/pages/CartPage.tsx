import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Typography,
  Button,
  Card,
  Space,
  Input,
  Flex,
  Divider,
  message,
  theme as antTheme
} from 'antd';
import {
  ArrowLeftOutlined,
  MinusOutlined,
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useCart } from '../stores/CartContext';
import { useSession } from '../stores/SessionContext';
import { api } from '../services/api';
import { getSession } from '../services/sessionStore';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export function CartPage() {
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { items, removeItem, updateQuantity, updateSpecialInstructions, getTotal, clearCart } = useCart();
  const { sessionId, tableNumber } = useSession();
  const { token: themeToken } = antTheme.useToken();
  const [submitting, setSubmitting] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleUpdateInstructions = (menuItemId: string, instructions: string) => {
    updateSpecialInstructions(menuItemId, instructions);
  };

  const handleSubmitOrder = async () => {
    if (!sessionId || items.length === 0 || !restaurantSlug) return;

    const { customerToken } = getSession();
    if (!customerToken) {
      navigate(`/${restaurantSlug}/register`, {
        state: { redirectTo: `/${restaurantSlug}/cart` },
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.orders.create(
        {
          session_id: sessionId,
          items: items.map(item => ({
            menu_item_id: item.menu_item.id,
            quantity: item.quantity,
            special_instructions: item.special_instructions,
          })),
        },
        restaurantSlug
      );
      clearCart();
      message.success('Order placed successfully!');
      navigate(`/${restaurantSlug}/orders`);
    } catch (error: any) {
      console.error('Failed to submit order:', error);
      if (error.message?.includes('customer session expired') || error.message?.includes('verify OTP')) {
        message.warning('Your session expired. Please login again.');
        navigate(`/${restaurantSlug}/register`, {
          state: { redirectTo: `/${restaurantSlug}/cart` },
        });
      } else {
        message.error('Failed to submit order. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Your Cart</Title>
          {tableNumber && (
            <Text type="secondary" style={{ fontSize: 12 }}>Table {tableNumber}</Text>
          )}
        </Space>
      </Header>

      <Content style={{ padding: '16px', paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {items.length === 0 ? (
            <Flex vertical align="center" justify="center" style={{ padding: '60px 0' }}>
              <Text type="secondary" style={{ marginBottom: 24, fontSize: 16 }}>Your cart is empty</Text>
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
              {items.map(item => (
                <Card
                  key={item.menu_item.id}
                  bordered={false}
                  styles={{ body: { padding: 12 } }}
                >
                  <Flex gap={16}>
                    <div style={{ flexShrink: 0 }}>
                      {item.menu_item.image_url ? (
                        <img
                          src={item.menu_item.image_url}
                          alt={item.menu_item.name}
                          style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                        />
                      ) : (
                        <Flex
                          align="center"
                          justify="center"
                          style={{ width: 64, height: 64, background: themeToken.colorFillSecondary, borderRadius: 8, fontSize: 24 }}
                        >
                          🍽️
                        </Flex>
                      )}
                    </div>

                    <Flex vertical style={{ flex: 1, minWidth: 0 }} justify="space-between">
                      <Flex justify="space-between" align="start">
                        <Text strong style={{ fontSize: 16 }} ellipsis>{item.menu_item.name}</Text>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.menu_item.id)}
                          style={{ marginTop: -4, marginRight: -8 }}
                        />
                      </Flex>

                      <Flex align="center" justify="space-between" style={{ marginTop: 8 }}>
                        <Text strong style={{ color: themeToken.colorPrimary }}>
                          ₹{(item.menu_item.price * item.quantity).toFixed(2)}
                        </Text>

                        <Space size={12}>
                          <Button
                            shape="circle"
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                            style={{ background: themeToken.colorFillSecondary }}
                          />
                          <Text strong style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                          <Button
                            type="primary"
                            shape="circle"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                          />
                        </Space>
                      </Flex>
                    </Flex>
                  </Flex>

                  <Divider style={{ margin: '12px 0' }} />

                  <Button
                    type="text"
                    block
                    icon={<MessageOutlined />}
                    onClick={() => setExpandedItem(expandedItem === item.menu_item.id ? null : item.menu_item.id)}
                    style={{ textAlign: 'left', padding: 0, height: 'auto', color: themeToken.colorTextSecondary }}
                  >
                    {item.special_instructions ? 'Edit instructions' : 'Add special instructions'}
                  </Button>

                  {expandedItem === item.menu_item.id && (
                    <TextArea
                      value={item.special_instructions || ''}
                      onChange={(e) => handleUpdateInstructions(item.menu_item.id, e.target.value)}
                      placeholder="E.g., No onions, extra spicy..."
                      autoSize={{ minRows: 2, maxRows: 4 }}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              ))}
            </Space>
          )}
        </div>
      </Content>

      {items.length > 0 && (
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
            <div style={{ marginBottom: 16 }}>
              <Flex justify="space-between" style={{ marginBottom: 4 }}>
                <Text type="secondary">Subtotal</Text>
                <Text>₹{getTotal().toFixed(2)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text strong style={{ fontSize: 18 }}>Total</Text>
                <Text strong style={{ fontSize: 18, color: themeToken.colorPrimary }}>₹{getTotal().toFixed(2)}</Text>
              </Flex>
            </div>
            <Button
              type="primary"
              size="large"
              block
              loading={submitting}
              onClick={handleSubmitOrder}
              style={{ height: 50, borderRadius: 12, fontWeight: 600 }}
            >
              {submitting ? 'Placing Order...' : !getSession().customerToken ? 'Verify & Place Order' : 'Place Order'}
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
