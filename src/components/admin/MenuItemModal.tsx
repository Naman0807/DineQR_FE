import { Modal, Form, Input, InputNumber, Select, Switch, Button } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { MenuCategory, MenuItemWithCategory, MenuItemCreate, MenuItemUpdate } from '../../types';

interface MenuItemModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    categories: MenuCategory[];
    editingItem?: MenuItemWithCategory | null;
}

export function MenuItemModal({
    visible,
    onCancel,
    onSuccess,
    categories,
    editingItem,
}: MenuItemModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (editingItem) {
                form.setFieldsValue({
                    category_id: editingItem.category_id,
                    name: editingItem.name,
                    description: editingItem.description || '',
                    price: editingItem.price,
                    is_available: editingItem.is_available,
                    image_url: editingItem.image_url || '',
                });
            } else {
                form.resetFields();
                if (categories.length > 0) {
                    form.setFieldsValue({ category_id: categories[0].id, is_available: true });
                }
            }
        }
    }, [visible, editingItem, form, categories]);

    const handleSubmit = async (values: MenuItemCreate) => {
        setLoading(true);
        try {
            if (editingItem) {
                const updateData: MenuItemUpdate = {
                    name: values.name,
                    description: values.description,
                    price: values.price,
                    is_available: values.is_available,
                    image_url: values.image_url,
                };
                await api.menu.updateItem(editingItem.id, updateData);
            } else {
                await api.menu.createItem(values);
            }
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('Failed to save menu item:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            open={visible}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            destroyOnClose
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="mt-4"
            >
                <Form.Item
                    name="category_id"
                    label="Category"
                    rules={[{ required: true, message: 'Please select a category' }]}
                >
                    <Select disabled={!!editingItem} size="large">
                        {categories.map((cat) => (
                            <Select.Option key={cat.id} value={cat.id}>
                                {cat.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Name"
                    rules={[{ required: true, message: 'Please enter item name' }]}
                >
                    <Input placeholder="Enter item name" size="large" />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea placeholder="Enter item description" rows={3} />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        name="price"
                        label="Price (₹)"
                        rules={[
                            { required: true, message: 'Please enter price' },
                            { type: 'number', min: 0.01, message: 'Price must be greater than 0' }
                        ]}
                    >
                        <InputNumber
                            className="w-full"
                            placeholder="0.00"
                            step={0.01}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item name="is_available" label="Available" valuePropName="checked">
                        <Switch className="bg-gray-200" />
                    </Form.Item>
                </div>

                <Form.Item name="image_url" label="Image URL (optional)">
                    <Input placeholder="Enter image URL" size="large" />
                </Form.Item>

                <Form.Item className="mb-0 mt-6 flex justify-end">
                    <div className="flex gap-3 justify-end">
                        <Button onClick={onCancel} size="large">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className="bg-orange-500 hover:bg-orange-600 border-none px-8"
                        >
                            {editingItem ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
}
