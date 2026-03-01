import React from 'react';
import { Button, Badge } from 'antd';
import type { Order, OrderStatus } from '../../../types';
import styles from './OrderCard.module.css';



interface OrderCardProps {
    order: Order;
    onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
    getTimeAgo: (dateString: string) => string;
    formatTime: (dateString: string) => string;
    statusConfig: Record<OrderStatus, { label: string; next?: OrderStatus; nextLabel?: string }>;
}

export const OrderCard: React.FC<OrderCardProps> = ({
    order,
    onStatusUpdate,
    getTimeAgo,
    formatTime,
    statusConfig
}) => {
    const currentConfig = statusConfig[order.status];

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.tableInfo}>
                    <span className={styles.tableName}>Table {order.table_number}</span>
                    <span className={styles.timeAgo}>{getTimeAgo(order.created_at)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className={styles.timeLabel}>{formatTime(order.created_at)}</span>
                    <Badge
                        status={order.status === 'received' ? 'processing' : order.status === 'preparing' ? 'warning' : 'success'}
                        text={currentConfig.label}
                        style={{ fontSize: '12px' }}
                    />
                </div>
            </div>

            <div className={styles.content}>
                <ul className={styles.itemList}>
                    {order.items.map((item) => (
                        <li key={item.id} className={styles.item}>
                            <div className={styles.itemDetails}>
                                <span className={styles.itemQuantity}>{item.quantity}x</span>
                                <span className={styles.itemName}>{item.menu_item_name}</span>
                            </div>
                            <span className={styles.itemPrice}>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.footer}>
                <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total</span>
                    <span className={styles.totalAmount}>₹{order.total_amount.toFixed(2)}</span>
                </div>

                {onStatusUpdate && currentConfig.next && (
                    <Button
                        type="primary"
                        className={styles.actionButton}
                        onClick={() => onStatusUpdate(order.id, currentConfig.next!)}
                    >
                        Mark as {currentConfig.nextLabel || statusConfig[currentConfig.next!].label}
                    </Button>
                )}
            </div>
        </div>
    );
};
