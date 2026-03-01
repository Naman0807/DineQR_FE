import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Card,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Flex,
  message,
  theme as antTheme,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  LogoutOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  SunOutlined,
  MoonOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { api } from '../services/api';
import { useAuth } from '../stores/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import type { RestaurantStatus, RestaurantWithAdmin } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface FormState {
  restaurant_name: string;
  admin_username: string;
  admin_email: string;
  admin_password?: string;
}

export function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<RestaurantWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantWithAdmin | null>(null);
  const [form] = Form.useForm();

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { token: themeToken } = antTheme.useToken();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const stats = useMemo(() => {
    const total = restaurants.length;
    const active = restaurants.filter((r) => r.status === 'active').length;
    const pending = restaurants.filter((r) => r.status === 'pending').length;
    const deactivated = restaurants.filter((r) => r.status === 'deactivated').length;
    return { total, active, pending, deactivated };
  }, [restaurants]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await api.superadmin.getRestaurants();
      setRestaurants(data);
    } catch (err) {
      const error = err as Error;
      message.error(error.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: RestaurantStatus) => {
    try {
      setUpdatingId(id);
      await api.superadmin.updateRestaurantStatus(id, newStatus);
      message.success(`Status updated to ${newStatus}`);
      await fetchRestaurants();
    } catch (err) {
      const error = err as Error;
      message.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setUpdatingId(id);
      await api.superadmin.deleteRestaurant(id);
      message.success('Restaurant removed successfully');
      await fetchRestaurants();
    } catch (err) {
      const error = err as Error;
      message.error(error.message || 'Failed to remove restaurant');
    } finally {
      setUpdatingId(null);
    }
  };

  const openForm = (restaurant?: RestaurantWithAdmin) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      form.setFieldsValue({
        restaurant_name: restaurant.name,
        admin_username: restaurant.admin_username,
        admin_email: restaurant.admin_email,
        admin_password: '',
      });
    } else {
      setEditingRestaurant(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: FormState) => {
    try {
      if (editingRestaurant) {
        await api.superadmin.updateRestaurant(editingRestaurant.id, values);
        message.success('Restaurant updated');
      } else {
        await api.superadmin.createRestaurant(values as any);
        message.success('Restaurant created');
      }
      setIsModalOpen(false);
      await fetchRestaurants();
    } catch (err) {
      const error = err as Error;
      message.error(error.message || 'Failed to save');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login', { replace: true });
  };

  const columns = [
    {
      title: 'Restaurant',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Admin Details',
      key: 'admin',
      render: (_: unknown, record: RestaurantWithAdmin) => (
        <Space direction="vertical" size={0}>
          <Text>{record.admin_username}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.admin_email}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: RestaurantStatus) => {
        const colors = { pending: 'orange', active: 'green', deactivated: 'red' };
        return <Tag color={colors[status]} style={{ borderRadius: 12, textTransform: 'capitalize' }}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: RestaurantWithAdmin) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleStatusUpdate(record.id, 'active')}
                loading={updatingId === record.id}
              >
                Approve
              </Button>
              <Button
                type="link"
                danger
                icon={<StopOutlined />}
                onClick={() => handleStatusUpdate(record.id, 'deactivated')}
                loading={updatingId === record.id}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'active' && (
            <Button
              type="link"
              danger
              icon={<StopOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'deactivated')}
              loading={updatingId === record.id}
            >
              Revoke
            </Button>
          )}
          {record.status === 'deactivated' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'active')}
              loading={updatingId === record.id}
            >
              Activate
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => openForm(record)} />
          <Popconfirm
            title="Remove restaurant?"
            description="This will delete the restaurant and its admin access."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
      <Header style={{
        background: themeToken.colorBgContainer,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        boxShadow: themeToken.boxShadowTertiary,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <Flex align="center" gap={12}>
          <SafetyOutlined style={{ fontSize: 24, color: themeToken.colorPrimary }} />
          <Title level={4} style={{ margin: 0 }}>Super Admin</Title>
        </Flex>
        <Space>
          <Button
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchRestaurants} loading={loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>Add New</Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>Logout</Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <Statistic title="Total" value={stats.total} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <Statistic title="Active" value={stats.active} valueStyle={{ color: '#3f8600' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <Statistic title="Deactivated" value={stats.deactivated} valueStyle={{ color: '#cf1322' }} />
              </Card>
            </Col>
          </Row>

          <Card bordered={false} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={restaurants}
              columns={columns}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </div>
      </Content>

      <Modal
        title={editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{ admin_password: '' }}
          style={{ marginTop: 24 }}
        >
          <Form.Item name="restaurant_name" label="Restaurant Name" rules={[{ required: true }]}>
            <Input placeholder="Enter restaurant name" size="large" />
          </Form.Item>
          <Form.Item name="admin_username" label="Admin Username" rules={[{ required: true }]}>
            <Input placeholder="Enter admin username" size="large" />
          </Form.Item>
          <Form.Item name="admin_email" label="Admin Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Enter admin email" size="large" />
          </Form.Item>
          <Form.Item
            name="admin_password"
            label={editingRestaurant ? 'New Password (optional)' : 'Admin Password'}
            rules={[{ required: !editingRestaurant }]}
          >
            <Input.Password placeholder="Enter password" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 32 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" size="large">
                {editingRestaurant ? 'Save Changes' : 'Create Restaurant'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
