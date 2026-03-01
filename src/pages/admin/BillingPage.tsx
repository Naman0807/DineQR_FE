import { useEffect, useState } from 'react';
import { Receipt, Settings } from 'lucide-react';
import { InputNumber, Space, Typography } from 'antd';
import { api } from '../../services/api';
import type { OrderSessionWithOrders, BillWithOrders, BillCreate, PaymentMethod } from '../../types';
import { BillView } from '../../components/admin/BillView';
import styles from './BillingPage.module.css';

const { Text } = Typography;

export function BillingPage() {
  const [sessions, setSessions] = useState<OrderSessionWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<OrderSessionWithOrders | null>(null);
  const [bill, setBill] = useState<BillWithOrders | null>(null);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(10); // Default 10%
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const activeOrders = await api.orders.getActive();
      const sessionMap = new Map<string, OrderSessionWithOrders>();

      activeOrders.forEach(order => {
        if (!sessionMap.has(order.session_id)) {
          sessionMap.set(order.session_id, {
            id: order.session_id,
            table_id: order.table_id || '',
            table_number: order.table_number || 0,
            session_status: 'active',
            started_at: order.created_at,
            orders: [],
          });
        }
        sessionMap.get(order.session_id)!.orders.push(order);
      });

      setSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (session: OrderSessionWithOrders) => {
    setSelectedSession(session);
    setDiscount(0);
    try {
      const existingBill = await api.bills.getBySession(session.id);
      setBill(existingBill);
    } catch {
      setBill(null);
    }
  };

  const calculateTotals = () => {
    if (!selectedSession) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = selectedSession.orders.reduce((sum, order) => sum + order.total_amount, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax - discount;
    return { subtotal, tax, total: Math.max(0, total) };
  };

  const handleGenerateBill = async () => {
    if (!selectedSession) return;
    setProcessing(true);
    try {
      const { subtotal, tax } = calculateTotals();
      const billData: BillCreate = {
        session_id: selectedSession.id,
        subtotal,
        tax_amount: tax,
        discount_amount: discount,
      };
      await api.bills.create(billData);
      const fullBill = await api.bills.getBySession(selectedSession.id);
      setBill(fullBill);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('bill already exists')) {
        try {
          const existingBill = await api.bills.getBySession(selectedSession.id);
          setBill(existingBill);
          return;
        } catch {
          // Fall through
        }
      }
      console.error('Failed to generate bill:', error);
      alert('Failed to generate bill');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (method: PaymentMethod) => {
    if (!bill) return;
    setProcessing(true);
    try {
      await api.bills.pay(bill.id, method);
      setSessions(prev => prev.filter(s => s.id !== selectedSession?.id));
      setSelectedSession(null);
      setBill(null);
      setDiscount(0);
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.grid}>
        <div className={`${styles.listSection} ${selectedSession ? styles.hiddenMobile : ''}`}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Billing</h1>
              <p className={styles.subtitle}>Select a table to generate bill and process payment</p>
            </div>

            <div className={styles.taxSettings}>
              <Space direction="vertical" size={2}>
                <Space size={4}>
                  <Settings size={14} color="var(--text-muted)" />
                  <Text type="secondary" strong>TAX SETTINGS</Text>
                </Space>
                <Space>
                  <Text type="secondary">GST (%)</Text>
                  <InputNumber
                    min={0}
                    max={100}
                    value={taxRate}
                    onChange={(val) => setTaxRate(val || 0)}
                    size="small"
                    style={{ width: 60 }}
                  />
                </Space>
              </Space>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <Receipt className={styles.emptyIcon} />
              <p className={styles.emptyTextMain}>No active tables</p>
              <p className={styles.emptyTextSub}>Tables with orders will appear here</p>
            </div>
          ) : (
            <div className={styles.tableList}>
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`${styles.tableItem} ${selectedSession?.id === session.id ? styles.tableItemActive : ''}`}
                >
                  <div className={styles.tableInfo}>
                    <span className={styles.tableNumber}>Table {session.table_number}</span>
                    <div className={styles.tableOrderCount}>
                      <span className={styles.statusDot}></span>
                      <span>{session.orders.length} Active order{session.orders.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className={styles.tableAmount}>
                    <span className={styles.amountValue}>
                      ₹{session.orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                    </span>
                    <span className={styles.amountLabel}>Total Owed</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.desktopOnly}>
          {selectedSession ? (
            <BillView
              selectedSession={selectedSession}
              bill={bill}
              discount={discount}
              taxRate={taxRate}
              setDiscount={setDiscount}
              processing={processing}
              onGenerateBill={handleGenerateBill}
              onPayment={handlePayment}
            />
          ) : (
            <div className={styles.placeholderContainer}>
              <Receipt className={styles.placeholderIcon} />
              <h3 className={styles.placeholderTitle}>No Table Selected</h3>
              <p className={styles.placeholderText}>
                Select an active table from the list to view and process its bill.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mobileOnly}>
        {selectedSession && (
          <BillView
            selectedSession={selectedSession}
            bill={bill}
            discount={discount}
            taxRate={taxRate}
            setDiscount={setDiscount}
            processing={processing}
            onGenerateBill={handleGenerateBill}
            onPayment={handlePayment}
            onBack={() => {
              setSelectedSession(null);
              setBill(null);
              setDiscount(0);
            }}
            isMobile={true}
          />
        )}
      </div>
    </div>
  );
}
