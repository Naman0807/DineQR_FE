import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useCart } from '../stores/CartContext';
import { useSession } from '../stores/SessionContext';
import { api } from '../services/api';

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, updateSpecialInstructions, getTotal, clearCart } = useCart();
  const { sessionId, tableNumber } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState<Record<string, string>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleUpdateInstructions = (menuItemId: string, instructions: string) => {
    setSpecialInstructions(prev => ({ ...prev, [menuItemId]: instructions }));
    updateSpecialInstructions(menuItemId, instructions);
  };

  const handleSubmitOrder = async () => {
    if (!sessionId || items.length === 0) return;

    setSubmitting(true);
    try {
      await api.orders.create({
        session_id: sessionId,
        items: items.map(item => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
        })),
      });
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Failed to submit order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4">
      <header className="bg-white shadow-sm sticky top-0 z-10 -mx-4 px-4 pt-2 safe-top">
        <div className="py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
            {tableNumber && (
              <p className="text-sm text-gray-500">Table {tableNumber}</p>
            )}
          </div>
        </div>
      </header>

      <main className="py-4 pb-40">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.menu_item.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex gap-4">
                  {item.menu_item.image_url ? (
                    <img
                      src={item.menu_item.image_url}
                      alt={item.menu_item.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{item.menu_item.name}</h3>
                    <p className="text-orange-500 font-medium mt-1">
                      ₹{(item.menu_item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.menu_item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedItem(expandedItem === item.menu_item.id ? null : item.menu_item.id)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {item.special_instructions ? 'Edit special instructions' : 'Add special instructions'}
                  </button>
                  {expandedItem === item.menu_item.id && (
                    <textarea
                      value={specialInstructions[item.menu_item.id] || item.special_instructions || ''}
                      onChange={(e) => handleUpdateInstructions(item.menu_item.id, e.target.value)}
                      placeholder="E.g., No onions, extra spicy..."
                      className="w-full mt-2 p-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={2}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 pb-6 safe-bottom">
          <div className="mb-3">
            <div className="flex justify-between text-gray-600 mb-1">
              <span>Subtotal</span>
              <span>₹{getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-500">₹{getTotal().toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleSubmitOrder}
            disabled={submitting || items.length === 0}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
}
