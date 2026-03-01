import React from 'react';
import { Typography } from 'antd';
import type { Order, OrderStatus } from '../../../types';
import { OrderCard } from './OrderCard';
import styles from './StatusColumn.module.css';

const { Text } = Typography;

interface StatusColumnProps {
    status: OrderStatus;
    label: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    color: string;
    bg: string;
    orders: Order[];
    onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
    getTimeAgo: (dateString: string) => string;
    formatTime: (dateString: string) => string;
    statusConfig: Record<OrderStatus, { label: string; next?: OrderStatus; nextLabel?: string }>;
}

export const StatusColumn: React.FC<StatusColumnProps> = ({
    label,
    icon: Icon,
    color,
    bg,
    orders,
    onStatusUpdate,
    getTimeAgo,
    formatTime,
    statusConfig
}) => {
    return (
        <div className={styles.column}>
            <div className={styles.header}>
                <div className={styles.iconWrapper} style={{ backgroundColor: bg }}>
                    <Icon size={20} color={color} />
                </div>
                <div className={styles.iconGroup}>
                    <h2 className={styles.title}>{label}</h2>
                    <span className={styles.count}>({orders.length})</span>
                </div>
            </div>

            <div className={styles.list}>
                {orders.length > 0 ? (
                    orders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={onStatusUpdate}
                            getTimeAgo={getTimeAgo}
                            formatTime={formatTime}
                            statusConfig={statusConfig}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <Text type="secondary">No {label.toLowerCase()} orders</Text>
                    </div>
                )}
            </div>
        </div>
    );
};
