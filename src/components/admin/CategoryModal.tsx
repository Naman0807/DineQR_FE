import { Modal, Form, Input, Button } from 'antd';
import { api } from '../../services/api';
import { useState } from 'react';

interface CategoryModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export function CategoryModal({ visible, onCancel, onSuccess }: CategoryModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: { name: string }) => {
        setLoading(true);
        try {
            await api.menu.createCategory({ name: values.name });
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('Failed to create category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Add Category"
            open={visible}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ name: '' }}
            >
                <Form.Item
                    name="name"
                    label="Category Name"
                    rules={[{ required: true, message: 'Please enter category name' }]}
                >
                    <Input placeholder="Enter category name" size="large" />
                </Form.Item>
                <Form.Item className="mb-0 flex justify-end">
                    <div className="flex gap-3 justify-end">
                        <Button onClick={onCancel} size="large">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className="bg-orange-500 hover:bg-orange-600"
                        >
                            Create
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
}
