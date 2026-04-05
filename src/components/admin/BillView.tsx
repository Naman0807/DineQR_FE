import React from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle, DollarSign, ArrowLeft, Send, Printer, Download } from 'lucide-react';
import type { OrderSessionWithOrders, BillWithOrders, PaymentMethod } from '../../types';
import styles from './BillView.module.css';

interface BillViewProps {
    selectedSession: OrderSessionWithOrders;
    bill: BillWithOrders | null;
    discount: number;
    taxRate: number;
    setDiscount: React.Dispatch<React.SetStateAction<number>>;
    processing: boolean;
    onGenerateBill: () => void | Promise<void>;
    onPayment: (method: PaymentMethod) => void | Promise<void>;
    onDownloadPDF?: () => void | Promise<void>;
    onBack?: () => void;
    isMobile?: boolean;
    hideActions?: boolean;
    restaurantName?: string;
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
    onDownloadPDF,
    onBack,
    isMobile = false,
    hideActions = false,
    restaurantName = 'Restaurant',
}) => {
    const allItems = selectedSession.orders.flatMap(o => o.items);
    const totalQuantity = allItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = selectedSession.orders.reduce((sum, order) => sum + order.total_amount, 0);

    const isHistoricalBill = hideActions && bill !== null;
    const tax = isHistoricalBill ? Number(bill!.tax_amount) : subtotal * (taxRate / 100);
    const displayTaxRate = isHistoricalBill && subtotal > 0 ? (Number(bill!.tax_amount) / subtotal) * 100 : taxRate;
    const total = subtotal + tax - discount;

    const paymentMethods: { method: PaymentMethod; icon: React.ElementType; label: string }[] = [
        { method: 'cash', icon: Banknote, label: 'Cash' },
        { method: 'card', icon: CreditCard, label: 'Card' },
        { method: 'upi', icon: Smartphone, label: 'UPI' },
    ];

    const formatDate = (dateStr: string) => {
        const dStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
        const date = new Date(dStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.billContainer} data-print-section="bill">
            {isMobile && onBack && (
                <div className={styles.mobileHeader}>
                    <button onClick={onBack} className={styles.backBtn}>
                        <ArrowLeft size={20} />
                    </button>
                    <span className={styles.headerTitle}>Bill Details</span>
                </div>
            )}
            {/* Top Metadata - Outside the box */}
            <div className={styles.topMeta}>
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Order No.</span>
                    <span className={styles.metaValue}>#{selectedSession.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Type</span>
                    <span className={styles.metaValue}>Dine In: {selectedSession.table_number}</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Amount</span>
                    <span className={styles.metaValue}>₹ {total.toFixed(2)} {bill?.payment_status === 'paid' ? 'PAID' : ''}</span>
                </div>
                <div className={styles.metaDivider} />
                <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Date</span>
                    <span className={styles.metaValue}>{formatDate(selectedSession.started_at)}</span>
                </div>
            </div>

            {/* Customer Details */}
            <div className={styles.customerDetails}>
                <span>Customer: Walk-in Customer</span>
            </div>

            {/* Main E-Bill Box */}
            <div className={styles.ebillBox}>
                {/* E-Bill Header */}
                <div className={styles.ebillHeader}>
                    <h2 className={styles.ebillTitle}>E-BILL</h2>
                    <h3 className={styles.restaurantName}>{restaurantName}</h3>
                    <p className={styles.billerName}>Biller: Admin</p>
                </div>

                {/* Items Table Header */}
                <div className={styles.itemsHeader}>
                    <span className={styles.colName}>Name</span>
                    <span className={styles.colQty}>Qty.</span>
                    <span className={styles.colRate}>Rate(₹)</span>
                    <span className={styles.colPrice}>Price(₹)</span>
                </div>

                <div className={styles.itemsDividerDotted} />

                {/* Items List */}
                <div className={styles.itemsList}>
                    {allItems.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                            <span className={styles.colName}>{item.menu_item_name}</span>
                            <span className={styles.colQty}>{item.quantity}</span>
                            <span className={styles.colRate}>₹{item.unit_price.toFixed(2)}</span>
                            <span className={styles.colPrice}>₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.itemsDividerSolid} />

                {/* Summary Section */}
                <div className={styles.summarySection}>
                    <div className={styles.summaryRow}>
                        <span>Total Quantity</span>
                        <span>{totalQuantity}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Sub Total</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Discount</span>
                            <span>-₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={styles.taxRow}>
                        <span>Tax ({displayTaxRate.toFixed(1)}%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                </div>

                <div className={styles.itemsDividerSolid} />

                {/* Final Total */}
                <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>Total Payable Amount</span>
                    <span className={styles.totalAmount}>₹{Math.max(0, total).toFixed(2)}</span>
                </div>
            </div>

            {/* Footer - Thank You */}
            <div className={styles.footer}>
                <p>Thank you for Choosing Us, Please Visit again</p>
            </div>

            {/* Action Section - Hidden when printing */}
            {!hideActions && (
                <div className={styles.actionSection} data-print-hide>
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
                            <div className={styles.buttonGroup}>
                                <button
                                    onClick={() => window.print()}
                                    className={styles.printBtn}
                                >
                                    <Printer size={20} />
                                    <span>Print Bill</span>
                                </button>
                                <button
                                    onClick={onDownloadPDF}
                                    disabled={processing}
                                    className={styles.downloadBtn}
                                >
                                    {processing ? (
                                        <div className={styles.spinner}></div>
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            <span>Download PDF</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {!bill.paid_at && (
                                <div className={styles.discountEditSection}>
                                    <div className={styles.discountLabel}>Add Discount</div>
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
                            )}

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
            )}
        </div>
    );
};
