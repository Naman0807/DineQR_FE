import React from 'react';
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, DollarSign, ArrowLeft, Send } from 'lucide-react';
import type { OrderSessionWithOrders, BillWithOrders, PaymentMethod } from '../../types';
import styles from './BillView.module.css';

interface BillViewProps {
    selectedSession: OrderSessionWithOrders;
    bill: BillWithOrders | null;
    discount: number;
    taxRate: number;
    setDiscount: (discount: number) => void;
    processing: boolean;
    onGenerateBill: () => void;
    onPayment: (method: PaymentMethod) => void;
    onBack?: () => void;
    isMobile?: boolean;
}

export const BillView: React.FC<BillViewProps> = ({
    selectedSession,
    bill,
    discount,
    taxRate,
    setDiscount,
    processing,
    onGenerateBill,
    onPayment,
    onBack,
    isMobile = false,
}) => {
    const calculateTotals = () => {
        const subtotal = selectedSession.orders.reduce((sum, order) => sum + order.total_amount, 0);
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax - discount;
        return { subtotal, tax, total: Math.max(0, total) };
    };

    const { subtotal, tax, total } = calculateTotals();

    const paymentMethods: { method: PaymentMethod; icon: React.ElementType; label: string }[] = [
        { method: 'cash', icon: Banknote, label: 'Cash' },
        { method: 'card', icon: CreditCard, label: 'Card' },
        { method: 'upi', icon: Smartphone, label: 'UPI' },
    ];

    return (
        <div className={styles.billContainer}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    {isMobile && onBack && (
                        <button onClick={onBack} className={styles.backBtn}>
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <Receipt size={20} color="var(--brand-primary)" />
                    <span>Table {selectedSession.table_number}</span>
                </div>
                <p className={styles.headerSubtitle}>
                    Session started at {new Date(selectedSession.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className={styles.itemList}>
                {selectedSession.orders.flatMap(o => o.items).map((item, idx) => (
                    <div key={idx} className={styles.itemRow}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemQuantity}>{item.quantity}x</span>
                            <span className={styles.itemName}>{item.menu_item_name}</span>
                        </div>
                        <span className={styles.itemPrice}>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className={styles.summarySection}>
                <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>Tax ({taxRate}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                </div>

                <div className={styles.discountRow}>
                    <span className={styles.discountLabel}>Discount</span>
                    <div className={styles.discountInputWrapper}>
                        <DollarSign className={styles.discountIcon} />
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className={styles.discountInput}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>

                <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total Amount</span>
                    <span className={styles.totalAmount}>₹{total.toFixed(2)}</span>
                </div>
            </div>

            <div className={styles.actionSection}>
                {!bill ? (
                    <button
                        onClick={onGenerateBill}
                        disabled={processing}
                        className={styles.generateBtn}
                    >
                        {processing ? (
                            <div className={styles.spinner}></div>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>Generate Bill</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div>
                        <div className={styles.successMessage}>
                            <CheckCircle size={20} />
                            <span>Bill Generated Successfully</span>
                        </div>
                        <div className={styles.paymentGrid}>
                            {paymentMethods.map(({ method, icon: Icon, label }) => (
                                <button
                                    key={method}
                                    onClick={() => onPayment(method)}
                                    disabled={processing}
                                    className={styles.paymentBtn}
                                >
                                    <Icon size={24} />
                                    <span className={styles.paymentLabel}>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
