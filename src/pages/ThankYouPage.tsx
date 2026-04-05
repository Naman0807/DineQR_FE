import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout, Typography, Flex, Spin, theme as antTheme } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import { api } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

export function ThankYouPage() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const { token: themeToken } = antTheme.useToken();
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurantName = async () => {
      try {
        if (restaurantSlug) {
          const settings = await api.settings.get();
          setRestaurantName(settings.restaurant_name);
        }
      } catch {
        setRestaurantName('');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurantName();
  }, [restaurantSlug]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
      <Content style={{ padding: '24px 16px' }}>
        <Flex
          vertical
          align="center"
          justify="center"
          style={{ minHeight: 'calc(100vh - 48px)', textAlign: 'center' }}
        >
          <Flex
            align="center"
            justify="center"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: themeToken.colorPrimaryBg,
              marginBottom: 24,
            }}
          >
            <HeartOutlined style={{ fontSize: 36, color: themeToken.colorPrimary }} />
          </Flex>

          <Title level={3} style={{ margin: '0 0 8px 0' }}>Thank You!</Title>

          {restaurantName && (
            <Text style={{ fontSize: 18, color: themeToken.colorTextSecondary, display: 'block', marginBottom: 24 }}>
              from {restaurantName}
            </Text>
          )}

          <Text type="secondary" style={{ fontSize: 16, maxWidth: 320, lineHeight: 1.6 }}>
            We hope you had a wonderful dining experience. Your visit means the world to us.
          </Text>

          <Text type="secondary" style={{ fontSize: 16, maxWidth: 320, lineHeight: 1.6, marginTop: 12 }}>
            We look forward to serving you again soon!
          </Text>

          <Text
            style={{
              marginTop: 40,
              fontSize: 13,
              color: themeToken.colorTextTertiary,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/${restaurantSlug}/menu`)}
          >
            Back to Menu
          </Text>
        </Flex>
      </Content>
    </Layout>
  );
}
