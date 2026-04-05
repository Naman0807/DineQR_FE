import React, { useEffect, useState, useCallback } from 'react';
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
import styles from './SettingsPage.module.css';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.settings.get();
            setSettings(data);
            form.setFieldsValue({
                restaurant_name: data.restaurant_name,
                admin_email: data.admin_email,
                admin_phone: data.admin_phone,
                restaurant_tax: data.restaurant_tax,
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            message.error('Failed to load restaurant settings');
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleUpdate = async (values: Partial<RestaurantSettings>) => {
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
            <div className={styles.container}>
                <Card className={styles.card}>
                    <Skeleton active />
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className={styles.header}>
                    <div>
                        <Title level={2} className={styles.headerTitle}>Restaurant Settings</Title>
                        <Text className={styles.headerSubtitle}>Manage your restaurant identity and billing configuration</Text>
                    </div>
                    {!isEditing && (
                        <Button
                            type="primary"
                            icon={<Edit2 size={16} />}
                            onClick={() => setIsEditing(true)}
                            className={styles.editBtn}
                        >
                            Edit Settings
                        </Button>
                    )}
                </div>

                <Card
                    bordered={false}
                    className={styles.card}
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

                            {/* <Form.Item
                                label="Phone Number"
                                name="admin_phone"
                                tooltip="Phone number can only be changed by the Superadmin."
                                rules={[
                                    { required: true, message: 'Please enter phone number' },
                                    { pattern: /^\+\d{1,4}\d{7,12}$/, message: 'Please enter a valid phone number with country code (e.g., +919016112497)' }
                                ]}
                            >
                                <Input prefix={<Phone size={16} />} disabled placeholder="+91 9090909090" />
                            </Form.Item> */}

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

                            <div className={styles.formFooter}>
                                <Space>
                                    <Button icon={<X size={16} />} onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<Save size={16} />}
                                        loading={loading}
                                        className={styles.saveBtn}
                                    >
                                        Save Changes
                                    </Button>
                                </Space>
                            </div>
                        </Form>
                    ) : (
                        <Descriptions
                            column={1}
                            bordered
                            contentStyle={{ fontWeight: 500, color: 'var(--text-primary)' }}
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
                                <Tag className={styles.taxTag}>
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
