import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { Download } from 'lucide-react';
import type { TableWithQR } from '../../types';

const { Title, Text } = Typography;

interface QRModalProps {
    visible: boolean;
    table: TableWithQR | null;
    onClose: () => void;
    onDownload: (table: TableWithQR) => void;
}

const QRModal: React.FC<QRModalProps> = ({ visible, table, onClose, onDownload }) => {
    if (!table) return null;

    const getQRDataUrl = (base64Data: string) => {
        if (base64Data.startsWith('data:')) return base64Data;
        return `data:image/png;base64,${base64Data}`;
    };

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={400}
            styles={{ body: { textAlign: 'center', padding: '32px 24px' } }}
        >
            <Title level={4} style={{ marginBottom: 4 }}>
                Table {table.table_number}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                Scan to view menu
            </Text>

            <div
                style={{
                    background: '#fff',
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #f0f0f0',
                    display: 'inline-block',
                    marginBottom: 24,
                }}
            >
                <img
                    src={getQRDataUrl(table.qr_code_url)}
                    alt="QR Code"
                    style={{ width: '100%', maxWidth: 240, height: 'auto' }}
                />
            </div>

            <Text
                copyable
                style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#bfbfbf',
                    marginBottom: 24,
                    wordBreak: 'break-all',
                }}
            >
                {`${window.location.origin}/menu?table=${table.qr_token}`}
            </Text>

            <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                <Button onClick={onClose} size="large">
                    Close
                </Button>
                <Button
                    type="primary"
                    icon={<Download size={18} />}
                    size="large"
                    onClick={() => onDownload(table)}
                    style={{ backgroundColor: '#ff782d', borderColor: '#ff782d' }}
                >
                    Download
                </Button>
            </Space>
        </Modal>
    );
};

export default QRModal;
