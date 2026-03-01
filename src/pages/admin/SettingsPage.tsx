import React, { useEffect, useState } from 'react';
import {
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    message,
    Typography,
    Space,
    Divider,
    Tag,
    Skeleton,
    Descriptions
} from 'antd';
import { Building2, Mail, Phone, Percent, Edit2, Save, X } from 'lucide-react';
import { api } from '../../services/api';
import type { RestaurantSettings } from '../../types';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await api.settings.get();
            setSettings(data);
            form.setFieldsValue({
                restaurant_name: data.restaurant_name,
                admin_email: data.admin_email,
                restaurant_tax: data.restaurant_tax,
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            message.error('Failed to load restaurant settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = async (values: any) => {
        try {
            setLoading(true);
            await api.settings.update(values);
            message.success('Settings updated successfully');
            setIsEditing(false);
            fetchSettings();
        } catch (error) {
            console.error('Failed to update settings:', error);
            message.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !settings) {
        return (
            <Card>
                <Skeleton active />
            </Card>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>Restaurant Settings</Title>
                        <Text type="secondary">Manage your restaurant identity and billing configuration</Text>
                    </div>
                    {!isEditing && (
                        <Button
                            type="primary"
                            icon={<Edit2 size={16} />}
                            onClick={() => setIsEditing(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            Edit Settings
                        </Button>
                    )}
                </div>

                <Card
                    bordered={false}
                    style={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        borderRadius: 12
                    }}
                >
                    {isEditing ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleUpdate}
                            initialValues={settings || {}}
                        >
                            <Form.Item
                                label="Restaurant Name"
                                name="restaurant_name"
                                rules={[{ required: true, message: 'Please enter restaurant name' }]}
                            >
                                <Input prefix={<Building2 size={16} />} placeholder="e.g. My Fine Dining" />
                            </Form.Item>

                            <Form.Item
                                label="Admin Email"
                                name="admin_email"
                                rules={[
                                    { required: true, message: 'Please enter admin email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input prefix={<Mail size={16} />} placeholder="admin@example.com" />
                            </Form.Item>

                            <Form.Item
                                label="Tax Percentage (%)"
                                name="restaurant_tax"
                                rules={[{ required: true, message: 'Please enter tax percentage' }]}
                            >
                                <InputNumber
                                    prefix={<Percent size={16} />}
                                    min={0}
                                    max={100}
                                    style={{ width: '100%' }}
                                    placeholder="e.g. 5"
                                />
                            </Form.Item>

                            <Divider />

                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button icon={<X size={16} />} onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<Save size={16} />}
                                    loading={loading}
                                >
                                    Save Changes
                                </Button>
                            </Space>
                        </Form>
                    ) : (
                        <Descriptions
                            column={1}
                            bordered
                            contentStyle={{ fontWeight: 500 }}
                            labelStyle={{ color: 'var(--text-secondary)', width: '30%' }}
                        >
                            <Descriptions.Item label={<Space><Building2 size={16} /> Restaurant Name</Space>}>
                                {settings?.restaurant_name}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><Mail size={16} /> Admin Email</Space>}>
                                {settings?.admin_email}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><Phone size={16} /> Phone Number</Space>}>
                                {settings?.admin_phone || <Text type="secondary">Not provided</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label={<Space><Percent size={16} /> Tax Configuration</Space>}>
                                <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                                    {settings?.restaurant_tax}%
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Restaurant ID">
                                <Text copyable type="secondary" style={{ fontSize: '12px' }}>
                                    {settings?.restaurant_id}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>
                    )}
                </Card>
            </Space>
        </div>
    );
};

export default SettingsPage;
