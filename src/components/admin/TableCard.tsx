import React from 'react';
import { Card, Button, Badge, Space, Typography, Popconfirm, Tooltip } from 'antd';
import { QrCode, Trash2 } from 'lucide-react';
import type { Table } from '../../types';

const { Text } = Typography;

interface TableCardProps {
    table: Table;
    onViewQR: (table: Table) => void;
    onDelete: (id: string) => void;
}

const TableCard: React.FC<TableCardProps> = ({ table, onViewQR, onDelete }) => {
    const statusColor = table.status === 'available' ? 'success' : 'warning';

    return (
        <Card
            hoverable
            style={{ borderRadius: '12px', textAlign: 'center' }}
            styles={{ body: { padding: '24px 16px' } }}
        >
            <div style={{ marginBottom: '16px' }}>
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 120, 45, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                    }}
                >
                    <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff782d' }}>
                        {table.table_number}
                    </Text>
                </div>
                <Badge status={statusColor} text={<Text type={table.status === 'available' ? 'success' : 'warning'}>{table.status}</Text>} />
            </div>

            <Space size="middle">
                <Tooltip title="View QR Code">
                    <Button
                        type="text"
                        icon={<QrCode size={20} />}
                        onClick={() => onViewQR(table)}
                        style={{ color: '#8c8c8c' }}
                    />
                </Tooltip>
                <Tooltip title="Delete Table">
                    <Popconfirm
                        title="Delete Table"
                        description="Are you sure you want to delete this table?"
                        onConfirm={() => onDelete(table.id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 size={20} />}
                            style={{ color: '#8c8c8c' }}
                        />
                    </Popconfirm>
                </Tooltip>
            </Space>
        </Card>
    );
};

export default TableCard;
