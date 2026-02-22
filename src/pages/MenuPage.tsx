import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { api } from '../services/api';
import { useSession } from '../stores/SessionContext';
import { useCart } from '../stores/CartContext';
import type { MenuItemWithCategory, MenuCategory } from '../types';

export function MenuPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, tableNumber, sessionId, qrToken } = useSession();
  const { addItem, removeItem, updateQuantity, items, getItemCount } = useCart();
  
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('table') || qrToken;

  useEffect(() => {
    const initSession = async () => {
      try {
        if (!token && !sessionId) {
          setError('Invalid QR code. Please scan again.');
          setLoading(false);
          return;
        }

        if (!sessionId && token) {
          const sessionData = await api.tables.getOrCreateSession(token);
          const tableData = await api.tables.getByToken(token);
          setSession(tableData.id, sessionData.table_number, sessionData.session_id, token);
        }

        const [itemsData, categoriesData] = await Promise.all([
          api.menu.getItems(true),
          api.menu.getCategories(),
        ]);

        setMenuItems(itemsData);
        setCategories(categoriesData.sort((a, b) => a.display_order - b.display_order));
        setLoading(false);
      } catch (err) {
        setError('Failed to load menu. Please try again.');
        setLoading(false);
      }
    };

    initSession();
  }, [token, sessionId, setSession]);

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems;

  const getItemQuantity = (menuItemId: string) => {
    const item = items.find(i => i.menu_item.id === menuItemId);
    return item?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 px-4">
      <header className="bg-white shadow-sm sticky top-0 z-10 -mx-4 px-4 pt-2 safe-top">
        <div className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Menu</h1>
              {tableNumber && (
                <p className="text-sm text-gray-500">Table {tableNumber}</p>
              )}
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 text-gray-600 hover:text-orange-500"
            >
              <ShoppingCart className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3 -mx-4 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="py-4">
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {item.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-orange-500">
                    ₹{item.price.toFixed(2)}
                  </span>
                  {getItemQuantity(item.id) > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {getItemQuantity(item.id)}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
                        className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(item)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No items available in this category.
          </div>
        )}
      </main>

      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 pb-6 safe-bottom">
          <button
            onClick={() => navigate('/cart')}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-orange-600"
          >
            <ShoppingCart className="w-5 h-5" />
            View Cart ({getItemCount()} items)
          </button>
        </div>
      )}
    </div>
  );
}
