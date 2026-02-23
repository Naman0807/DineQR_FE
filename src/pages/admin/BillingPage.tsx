import { useEffect, useState } from 'react';
import { Receipt, CreditCard, Banknote, Smartphone, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';
import type { OrderSessionWithOrders, BillWithOrders, BillCreate, PaymentMethod } from '../../types';

export function BillingPage() {
  const [sessions, setSessions] = useState<OrderSessionWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<OrderSessionWithOrders | null>(null);
  const [bill, setBill] = useState<BillWithOrders | null>(null);
  const [discount, setDiscount] = useState(0);
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
    const tax = subtotal * 0.1;
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

  const paymentMethods: { method: PaymentMethod; icon: typeof CreditCard; label: string }[] = [
    { method: 'cash', icon: Banknote, label: 'Cash' },
    { method: 'card', icon: CreditCard, label: 'Card' },
    { method: 'upi', icon: Smartphone, label: 'UPI' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop View */}
      <div className="hidden md:grid gap-5 md:gap-6 grid-cols-1 md:grid-cols-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Billing</h1>
          <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">Select a table to generate bill and process payment</p>

           {sessions.length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 text-center">
               <Receipt className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500">No active tables</p>
              <p className="text-sm text-gray-400 mt-1">Tables with orders will appear here</p>
            </div>
          ) : (
             <div className="space-y-3">
               {sessions.map(session => (
                 <button
                   key={session.id}
                   onClick={() => handleSelectSession(session)}
                   className={`w-full p-4 rounded-xl border text-left transition-all min-h-[60px]
                     ${selectedSession?.id === session.id
                       ? 'border-orange-500 bg-orange-50'
                       : 'border-gray-100 bg-white hover:border-gray-200'
                     }`}
                 >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-lg">Table {session.table_number}</span>
                      <p className="text-sm text-gray-500">
                        {session.orders.length} order{session.orders.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-orange-500">
                      ₹{session.orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSession && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Table {selectedSession.table_number}</h2>
              <p className="text-sm text-gray-500">Session started at {new Date(selectedSession.started_at).toLocaleTimeString()}</p>
            </div>

            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {selectedSession.orders.flatMap(o => o.items).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.menu_item_name}</span>
                  </span>
                  <span className="text-gray-500">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (10%)</span>
                <span>₹{calculateTotals().tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Discount</span>
                <div className="flex-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-500">₹{calculateTotals().total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              {!bill ? (
                <button
                  onClick={handleGenerateBill}
                  disabled={processing}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300"
                >
                  {processing ? 'Processing...' : 'Generate Bill'}
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Bill Generated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(({ method, icon: Icon, label }) => (
                      <button
                        key={method}
                        onClick={() => handlePayment(method)}
                        disabled={processing}
                        className="flex flex-col items-center gap-1 py-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50"
                      >
                        <Icon className="w-6 h-6 text-gray-600" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {!selectedSession ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Billing</h1>
            <p className="text-gray-500 mb-4 text-sm">Select a table to generate bill</p>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active tables</p>
                <p className="text-sm text-gray-400 mt-1">Tables with orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className="w-full p-4 rounded-xl border border-gray-100 bg-white text-left hover:border-gray-200 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-lg">Table {session.table_number}</span>
                        <p className="text-sm text-gray-500">
                          {session.orders.length} order{session.orders.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-orange-500">
                        ₹{session.orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setBill(null);
                  setDiscount(0);
                }}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-bold">Table {selectedSession.table_number}</h2>
                <p className="text-xs text-gray-500">Session started at {new Date(selectedSession.started_at).toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
              {selectedSession.orders.flatMap(o => o.items).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.menu_item_name}</span>
                  </span>
                  <span className="text-gray-500">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (10%)</span>
                <span>₹{calculateTotals().tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Discount</span>
                <div className="flex-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-500">₹{calculateTotals().total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              {!bill ? (
                <button
                  onClick={handleGenerateBill}
                  disabled={processing}
                  className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300"
                >
                  {processing ? 'Processing...' : 'Generate Bill'}
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Bill Generated</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(({ method, icon: Icon, label }) => (
                      <button
                        key={method}
                        onClick={() => handlePayment(method)}
                        disabled={processing}
                        className="flex flex-col items-center gap-1 py-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 disabled:opacity-50"
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
