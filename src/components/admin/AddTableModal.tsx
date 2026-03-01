import React from 'react';
import { Modal, Form, InputNumber } from 'antd';

interface AddTableModalProps {
    visible: boolean;
    loading: boolean;
    onCancel: () => void;
    onConfirm: (tableNumber: number) => void;
}

const AddTableModal: React.FC<AddTableModalProps> = ({ visible, loading, onCancel, onConfirm }) => {
    const [form] = Form.useForm();

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onConfirm(values.tableNumber);
            form.resetFields();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title="Add New Table"
            open={visible}
            onOk={handleOk}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            confirmLoading={loading}
            okText="Create"
            cancelText="Cancel"
            centered
            destroyOnClose
        >
            <Form form={form} layout="vertical" initialValues={{ tableNumber: 1 }}>
                <Form.Item
                    name="tableNumber"
                    label="Table Number"
                    rules={[{ required: true, message: 'Please enter table number' }]}
                >
                    <InputNumber
                        min={1}
                        style={{ width: '100%' }}
                        placeholder="Enter table number"
                        autoFocus
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddTableModal;
